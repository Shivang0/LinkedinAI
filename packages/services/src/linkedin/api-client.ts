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
}

/**
 * Creates a LinkedInApiClient instance
 */
export function createLinkedInClient(accessToken: string): LinkedInApiClient {
  return new LinkedInApiClient({ accessToken });
}
