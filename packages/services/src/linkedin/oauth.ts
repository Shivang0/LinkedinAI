/**
 * LinkedIn OAuth 2.0 Service
 * Handles authentication flow with LinkedIn
 */

export interface LinkedInTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
}

export interface LinkedInEmail {
  emailAddress: string;
}

export interface LinkedInUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  profileImageUrl?: string;
}

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

/**
 * Generates the LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  state?: string;
}): string {
  const scopes = [
    'openid',
    'profile',
    'email',
    'w_member_social', // Required for posting
  ];

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: scopes.join(' '),
    state: config.state || generateState(),
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access tokens
 */
export async function exchangeCodeForTokens(config: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<LinkedInTokens> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: config.code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

/**
 * Refreshes the access token using refresh token
 */
export async function refreshAccessToken(config: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<LinkedInTokens> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

/**
 * Gets the user's LinkedIn profile
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInUser> {
  // Get basic profile info using userinfo endpoint (OpenID Connect)
  const userinfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userinfoResponse.ok) {
    throw new Error('Failed to fetch LinkedIn profile');
  }

  const userinfo = await userinfoResponse.json();

  return {
    id: userinfo.sub,
    email: userinfo.email,
    firstName: userinfo.given_name,
    lastName: userinfo.family_name,
    name: userinfo.name,
    profileImageUrl: userinfo.picture,
  };
}

/**
 * Generates a random state parameter for OAuth
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
