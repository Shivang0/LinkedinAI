/**
 * LinkedIn API Client
 * Handles interactions with LinkedIn REST API
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
}

/**
 * Creates a LinkedInApiClient instance
 */
export function createLinkedInClient(accessToken: string): LinkedInApiClient {
  return new LinkedInApiClient({ accessToken });
}
