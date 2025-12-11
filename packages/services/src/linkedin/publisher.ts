/**
 * LinkedIn Publisher Service
 * Handles posting content to LinkedIn
 */

const LINKEDIN_API_URL = 'https://api.linkedin.com';

export interface PublishOptions {
  content: string;
  authorId: string; // LinkedIn member URN (urn:li:person:xxx)
  mediaUrls?: string[];
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface LinkedInPublisherConfig {
  accessToken: string;
}

export class LinkedInPublisher {
  private accessToken: string;

  constructor(config: LinkedInPublisherConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Publishes a text post to LinkedIn
   */
  async publishText(options: PublishOptions): Promise<PublishResult> {
    try {
      const postBody = {
        author: `urn:li:person:${options.authorId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: options.content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': options.visibility || 'PUBLIC',
        },
      };

      const response = await fetch(`${LINKEDIN_API_URL}/v2/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `LinkedIn API error (${response.status}): ${errorText}`,
        };
      }

      const result = await response.json();
      const postId = result.id;

      // Extract activity ID from URN for constructing URL
      const activityMatch = postId?.match(/urn:li:share:(\d+)/);
      const activityId = activityMatch ? activityMatch[1] : null;

      return {
        success: true,
        postId,
        postUrl: activityId
          ? `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Publishes a post with image(s) to LinkedIn
   */
  async publishWithMedia(options: PublishOptions): Promise<PublishResult> {
    // For now, fall back to text-only if media handling is needed
    // Full media upload requires registering upload, uploading binary, then posting
    // This is a simplified version that can be expanded later

    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      return this.publishText(options);
    }

    try {
      // Step 1: Register upload for each media
      const mediaAssets: string[] = [];

      for (const mediaUrl of options.mediaUrls) {
        const asset = await this.registerAndUploadMedia(options.authorId, mediaUrl);
        if (asset) {
          mediaAssets.push(asset);
        }
      }

      // Step 2: Create post with media
      const postBody = {
        author: `urn:li:person:${options.authorId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: options.content,
            },
            shareMediaCategory: 'IMAGE',
            media: mediaAssets.map((asset) => ({
              status: 'READY',
              media: asset,
            })),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': options.visibility || 'PUBLIC',
        },
      };

      const response = await fetch(`${LINKEDIN_API_URL}/v2/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `LinkedIn API error (${response.status}): ${errorText}`,
        };
      }

      const result = await response.json();
      const postId = result.id;

      return {
        success: true,
        postId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Registers and uploads media to LinkedIn
   * Returns the asset URN on success
   */
  private async registerAndUploadMedia(
    authorId: string,
    mediaUrl: string
  ): Promise<string | null> {
    try {
      // Step 1: Register upload
      const registerBody = {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${authorId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      };

      const registerResponse = await fetch(
        `${LINKEDIN_API_URL}/v2/assets?action=registerUpload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerBody),
        }
      );

      if (!registerResponse.ok) {
        return null;
      }

      const registerResult = await registerResponse.json();
      const uploadUrl =
        registerResult.value?.uploadMechanism?.[
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ]?.uploadUrl;
      const asset = registerResult.value?.asset;

      if (!uploadUrl || !asset) {
        return null;
      }

      // Step 2: Download image from URL
      const imageResponse = await fetch(mediaUrl);
      if (!imageResponse.ok) {
        return null;
      }
      const imageBuffer = await imageResponse.arrayBuffer();

      // Detect MIME type from URL extension or response headers
      const contentTypeHeader = imageResponse.headers.get('content-type');
      let mimeType = contentTypeHeader || 'image/jpeg';

      // Fallback: detect from URL extension if header is generic
      if (!contentTypeHeader || contentTypeHeader === 'application/octet-stream') {
        const urlLower = mediaUrl.toLowerCase();
        if (urlLower.includes('.png')) {
          mimeType = 'image/png';
        } else if (urlLower.includes('.gif')) {
          mimeType = 'image/gif';
        } else if (urlLower.includes('.webp')) {
          mimeType = 'image/webp';
        } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
          mimeType = 'image/jpeg';
        }
      }

      // Step 3: Upload to LinkedIn
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': mimeType,
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        return null;
      }

      return asset;
    } catch {
      return null;
    }
  }

  /**
   * Publishes content - automatically handles text vs media posts
   */
  async publish(options: PublishOptions): Promise<PublishResult> {
    if (options.mediaUrls && options.mediaUrls.length > 0) {
      return this.publishWithMedia(options);
    }
    return this.publishText(options);
  }
}

/**
 * Creates a LinkedInPublisher instance
 */
export function createLinkedInPublisher(accessToken: string): LinkedInPublisher {
  return new LinkedInPublisher({ accessToken });
}
