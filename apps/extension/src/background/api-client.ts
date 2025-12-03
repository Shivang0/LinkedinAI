import { API_BASE_URL } from '@/shared/constants';
import { getAuthToken } from '@/shared/storage';
import type { CommentTone, CommentStyle, CommentLength } from '@/shared/constants';

interface ApiOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  requiresAuth?: boolean;
}

interface ApiError {
  error: string;
  status: number;
}

/**
 * Make an API call to the backend
 */
async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Use default error message
    }
    const error: ApiError = { error: errorMessage, status: response.status };
    throw error;
  }

  return response.json();
}

/**
 * Generate a comment for a LinkedIn post
 */
export interface GenerateCommentParams {
  postContent: string;
  postAuthor: string;
  postAuthorHeadline?: string;
  tone: CommentTone;
  style: CommentStyle;
  length: CommentLength;
}

export interface GenerateCommentResult {
  comment: string;
  alternatives: string[];
}

export async function generateComment(params: GenerateCommentParams): Promise<GenerateCommentResult> {
  return apiCall<GenerateCommentResult>('/extension/comments/generate', {
    method: 'POST',
    body: params,
  });
}

/**
 * Verify authentication status
 */
export interface AuthVerifyResult {
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
  };
}

export async function verifyAuth(): Promise<AuthVerifyResult> {
  try {
    return await apiCall<AuthVerifyResult>('/extension/auth', {
      method: 'GET',
    });
  } catch {
    return { authenticated: false };
  }
}

/**
 * Verify authentication with a provided token (before storing)
 */
export async function verifyAuthWithToken(token: string): Promise<AuthVerifyResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/extension/auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return response.json();
  } catch {
    return { authenticated: false };
  }
}

/**
 * Refresh the extension token
 */
export interface RefreshTokenResult {
  token: string;
  expiresAt: number;
}

export async function refreshToken(): Promise<RefreshTokenResult> {
  return apiCall<RefreshTokenResult>('/extension/token/refresh', {
    method: 'POST',
  });
}

/**
 * Exchange web session for extension token
 */
export async function exchangeToken(sessionToken: string): Promise<RefreshTokenResult> {
  return apiCall<RefreshTokenResult>('/extension/token', {
    method: 'POST',
    body: { sessionToken },
    requiresAuth: false,
  });
}
