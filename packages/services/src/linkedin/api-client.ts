/**
 * LinkedIn API Client
 * Handles interactions with LinkedIn REST API
 * Includes Advertising API support for engagement metrics
 */

const LINKEDIN_API_URL = 'https://api.linkedin.com';

export interface LinkedInApiConfig {
  accessToken: string;
}

export interface LinkedInMember {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  headline?: string;
  vanityName?: string;
  profilePicture?: {
    displayImage: string;
  };
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export interface LinkedInPost {
  id: string;
  urn: string;
  content: string;
  publishedAt: Date;
  visibility: string;
  mediaUrls?: string[];
}

export interface PostWithEngagement extends LinkedInPost {
  engagement: EngagementMetrics;
}

export class LinkedInApiClient {
  private accessToken: string;

  constructor(config: LinkedInApiConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Makes an authenticated request to LinkedIn API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${LINKEDIN_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn API error (${response.status}): ${error}`);
    }

    // Some endpoints return empty body
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
  }

  /**
   * Gets the current user's member ID (needed for posting)
   */
  async getCurrentMember(): Promise<{ id: string }> {
    const response = await this.request<{ sub: string }>('/v2/userinfo');
    return { id: response.sub };
  }

  /**
   * Gets the user's LinkedIn profile details
   */
  async getProfile(): Promise<LinkedInMember> {
    return this.request<LinkedInMember>('/v2/me');
  }

  /**
   * Validates that the access token is still valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.request('/v2/userinfo');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets engagement metrics for a specific post
   * Note: LinkedIn's standard API has limited engagement data for personal profiles.
   * Full analytics (impressions, clicks) requires LinkedIn Marketing API with company page access.
   *
   * @param postUrn - The LinkedIn post URN (e.g., "urn:li:share:123456789")
   */
  async getPostEngagement(postUrn: string): Promise<EngagementMetrics> {
    // URL encode the URN for the API call
    const encodedUrn = encodeURIComponent(postUrn);

    let likes = 0;
    let comments = 0;

    try {
      // Fetch likes count
      const likesResponse = await this.request<{ paging?: { total?: number } }>(
        `/v2/socialActions/${encodedUrn}/likes?count=true`
      );
      likes = likesResponse.paging?.total || 0;
    } catch (error) {
      console.warn('Failed to fetch likes for post:', postUrn, error);
    }

    try {
      // Fetch comments count
      const commentsResponse = await this.request<{ paging?: { total?: number } }>(
        `/v2/socialActions/${encodedUrn}/comments?count=true`
      );
      comments = commentsResponse.paging?.total || 0;
    } catch (error) {
      console.warn('Failed to fetch comments for post:', postUrn, error);
    }

    // Note: Shares, impressions, and clicks are not available via standard API
    // They would require LinkedIn Marketing API and company page access
    return {
      likes,
      comments,
      shares: 0, // Not available via standard API
      impressions: 0, // Requires Marketing API
      clicks: 0, // Requires Marketing API
    };
  }

  /**
   * Gets the social actions summary for a post (simpler endpoint)
   */
  async getSocialActionsSummary(postUrn: string): Promise<{
    numLikes: number;
    numComments: number;
    liked: boolean;
  }> {
    const encodedUrn = encodeURIComponent(postUrn);

    try {
      const response = await this.request<{
        numLikes?: number;
        numComments?: number;
        liked?: boolean;
      }>(`/v2/socialActions/${encodedUrn}`);

      return {
        numLikes: response.numLikes || 0,
        numComments: response.numComments || 0,
        liked: response.liked || false,
      };
    } catch (error) {
      console.warn('Failed to fetch social actions summary:', postUrn, error);
      return { numLikes: 0, numComments: 0, liked: false };
    }
  }

  /**
   * Fetches all posts authored by the current user
   * Uses the Posts API to retrieve historical posts
   */
  async getUserPosts(count = 100): Promise<LinkedInPost[]> {
    const member = await this.getCurrentMember();
    const authorUrn = `urn:li:person:${member.id}`;
    const posts: LinkedInPost[] = [];
    let start = 0;
    const pageSize = 50;

    try {
      while (posts.length < count) {
        const response = await this.request<{
          elements?: Array<{
            id: string;
            author: string;
            commentary?: string;
            content?: {
              multiImage?: { images: Array<{ id: string }> };
              article?: { source: string };
              media?: { id: string };
            };
            visibility?: string;
            lifecycleState?: string;
            publishedAt?: number;
            createdAt?: number;
          }>;
          paging?: { total?: number; start?: number; count?: number };
        }>(`/rest/posts?q=author&author=${encodeURIComponent(authorUrn)}&count=${pageSize}&start=${start}`, {
          headers: {
            'LinkedIn-Version': '202401',
          },
        });

        if (!response.elements || response.elements.length === 0) {
          break;
        }

        for (const post of response.elements) {
          // Only include published posts
          if (post.lifecycleState !== 'PUBLISHED') continue;

          const mediaUrls: string[] = [];
          if (post.content?.multiImage?.images) {
            mediaUrls.push(...post.content.multiImage.images.map(img => img.id));
          }
          if (post.content?.article?.source) {
            mediaUrls.push(post.content.article.source);
          }

          posts.push({
            id: post.id,
            urn: `urn:li:share:${post.id}`,
            content: post.commentary || '',
            publishedAt: new Date(post.publishedAt || post.createdAt || Date.now()),
            visibility: post.visibility || 'PUBLIC',
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          });
        }

        // Check if we've fetched all available posts
        if (response.elements.length < pageSize) {
          break;
        }

        start += pageSize;
      }

      return posts;
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      // Fallback: try the older ugcPosts API
      return this.getUserPostsLegacy(count);
    }
  }

  /**
   * Legacy method to fetch posts using UGC Posts API
   */
  private async getUserPostsLegacy(count = 100): Promise<LinkedInPost[]> {
    const member = await this.getCurrentMember();
    const authorUrn = `urn:li:person:${member.id}`;
    const posts: LinkedInPost[] = [];

    try {
      const response = await this.request<{
        elements?: Array<{
          id: string;
          author: string;
          specificContent?: {
            'com.linkedin.ugc.ShareContent'?: {
              shareCommentary?: { text?: string };
              media?: Array<{ media?: string; originalUrl?: string }>;
            };
          };
          visibility?: { 'com.linkedin.ugc.MemberNetworkVisibility'?: string };
          lifecycleState?: string;
          created?: { time?: number };
          firstPublishedAt?: number;
        }>;
      }>(`/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(authorUrn)})&count=${count}`);

      if (response.elements) {
        for (const post of response.elements) {
          if (post.lifecycleState !== 'PUBLISHED') continue;

          const shareContent = post.specificContent?.['com.linkedin.ugc.ShareContent'];
          const mediaUrls = shareContent?.media
            ?.map(m => m.originalUrl || m.media)
            .filter((url): url is string => !!url);

          posts.push({
            id: post.id.replace('urn:li:ugcPost:', '').replace('urn:li:share:', ''),
            urn: post.id,
            content: shareContent?.shareCommentary?.text || '',
            publishedAt: new Date(post.firstPublishedAt || post.created?.time || Date.now()),
            visibility: post.visibility?.['com.linkedin.ugc.MemberNetworkVisibility'] || 'PUBLIC',
            mediaUrls,
          });
        }
      }

      return posts;
    } catch (error) {
      console.error('Failed to fetch posts with legacy API:', error);
      return [];
    }
  }

  /**
   * Gets engagement metrics using Advertising API
   * Provides more detailed metrics including impressions and clicks
   */
  async getPostEngagementAdvanced(postUrn: string): Promise<EngagementMetrics> {
    // Normalize URN format
    const shareUrn = postUrn.includes('urn:li:share:')
      ? postUrn
      : postUrn.includes('urn:li:ugcPost:')
        ? postUrn.replace('urn:li:ugcPost:', 'urn:li:share:')
        : `urn:li:share:${postUrn}`;

    let likes = 0;
    let comments = 0;
    let shares = 0;
    let impressions = 0;
    let clicks = 0;

    // Try to get metrics from socialMetrics endpoint (Advertising API)
    try {
      const encodedUrn = encodeURIComponent(shareUrn);
      const response = await this.request<{
        elements?: Array<{
          totalShareStatistics?: {
            shareCount?: number;
            likeCount?: number;
            commentCount?: number;
            impressionCount?: number;
            clickCount?: number;
            engagement?: number;
            uniqueImpressionsCount?: number;
          };
        }>;
      }>(`/rest/socialMetrics/${encodedUrn}`, {
        headers: {
          'LinkedIn-Version': '202401',
        },
      });

      if (response.elements && response.elements.length > 0) {
        const stats = response.elements[0].totalShareStatistics;
        if (stats) {
          likes = stats.likeCount || 0;
          comments = stats.commentCount || 0;
          shares = stats.shareCount || 0;
          impressions = stats.impressionCount || stats.uniqueImpressionsCount || 0;
          clicks = stats.clickCount || 0;
        }
      }
    } catch (advancedError) {
      console.warn('Advertising API metrics not available, falling back to basic:', advancedError);

      // Fallback to basic social actions
      const basicMetrics = await this.getPostEngagement(shareUrn);
      return basicMetrics;
    }

    return { likes, comments, shares, impressions, clicks };
  }

  /**
   * Fetches all posts with their engagement metrics
   * Combines getUserPosts with engagement data
   */
  async getAllPostsWithEngagement(maxPosts = 100): Promise<PostWithEngagement[]> {
    const posts = await this.getUserPosts(maxPosts);
    const postsWithEngagement: PostWithEngagement[] = [];

    for (const post of posts) {
      try {
        // Try advanced metrics first, then fall back to basic
        const engagement = await this.getPostEngagementAdvanced(post.urn);
        postsWithEngagement.push({
          ...post,
          engagement,
        });
      } catch (error) {
        console.warn(`Failed to fetch engagement for post ${post.id}:`, error);
        postsWithEngagement.push({
          ...post,
          engagement: { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 },
        });
      }
    }

    return postsWithEngagement;
  }
}

/**
 * Creates a LinkedInApiClient instance
 */
export function createLinkedInClient(accessToken: string): LinkedInApiClient {
  return new LinkedInApiClient({ accessToken });
}
