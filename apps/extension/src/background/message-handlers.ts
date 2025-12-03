import type {
  ExtensionMessage,
  GenerateCommentResponse,
  AuthResponse,
  UserInfoResponse,
  SimpleResponse,
} from '@/shared/types/messages';
import { isAuthenticated, clearAuth, getUserInfo, needsTokenRefresh, setAuth, getAuth } from '@/shared/storage';
import { generateComment, verifyAuth, verifyAuthWithToken, refreshToken } from './api-client';
import { API_BASE_URL } from '@/shared/constants';

/**
 * Set up message handlers for content script communication
 */
export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message as ExtensionMessage)
      .then(sendResponse)
      .catch((error) => {
        console.error('[LinkedIn AI] Message handler error:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error' });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  });
}

/**
 * Handle incoming messages from content script or popup
 */
async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case 'GENERATE_COMMENT':
      return handleGenerateComment(message.payload);

    case 'CHECK_AUTH':
      return handleCheckAuth();

    case 'LOGIN':
      return handleLogin();

    case 'LOGOUT':
      return handleLogout();

    case 'REFRESH_TOKEN':
      return handleRefreshToken();

    case 'GET_USER_INFO':
      return handleGetUserInfo();

    case 'STORE_AUTH_TOKEN':
      return handleStoreAuthToken(message.payload);

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Handle comment generation request
 */
async function handleGenerateComment(
  payload: ExtensionMessage extends { type: 'GENERATE_COMMENT'; payload: infer P } ? P : never
): Promise<GenerateCommentResponse> {
  // Check authentication
  if (!(await isAuthenticated())) {
    return { success: false, error: 'Not authenticated. Please sign in to use AI comments.' };
  }

  // Check if token needs refresh
  if (await needsTokenRefresh()) {
    try {
      await handleRefreshToken();
    } catch (error) {
      console.warn('[LinkedIn AI] Token refresh failed:', error);
      // Continue anyway, the request might still work
    }
  }

  try {
    const result = await generateComment({
      postContent: payload.postContent,
      postAuthor: payload.postAuthor,
      postAuthorHeadline: payload.postAuthorHeadline,
      tone: payload.tone,
      style: payload.style,
      length: payload.length,
    });

    return {
      success: true,
      comment: result.comment,
      alternatives: result.alternatives,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate comment';
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle authentication check
 */
async function handleCheckAuth(): Promise<AuthResponse> {
  try {
    // First check local storage
    const auth = await getAuth();
    if (!auth) {
      return { authenticated: false };
    }

    // Verify with server
    const result = await verifyAuth();
    return result;
  } catch {
    return { authenticated: false };
  }
}

/**
 * Handle login request - opens the authorization page
 */
async function handleLogin(): Promise<SimpleResponse> {
  try {
    // Open the authorization page in a new tab
    const authUrl = `${API_BASE_URL.replace('/api', '')}/extension/authorize`;
    await chrome.tabs.create({ url: authUrl });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to open login page' };
  }
}

/**
 * Handle logout request
 */
async function handleLogout(): Promise<SimpleResponse> {
  try {
    await clearAuth();
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to logout' };
  }
}

/**
 * Handle token refresh
 */
async function handleRefreshToken(): Promise<SimpleResponse> {
  try {
    const currentAuth = await getAuth();
    if (!currentAuth) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await refreshToken();

    // Update stored auth with new token
    await setAuth({
      ...currentAuth,
      token: result.token,
      expiresAt: result.expiresAt,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to refresh token' };
  }
}

/**
 * Handle get user info request
 */
async function handleGetUserInfo(): Promise<UserInfoResponse> {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    return { success: false, error: 'Not authenticated' };
  }

  return {
    success: true,
    user: userInfo,
  };
}

/**
 * Handle storing auth token from auth-capture content script
 */
async function handleStoreAuthToken(
  payload: { token: string; expiresAt: number }
): Promise<SimpleResponse> {
  try {
    console.log('[LinkedIn AI] Storing auth token...');

    // Verify the token and get user info
    const authResult = await verifyAuthWithToken(payload.token);

    if (!authResult.authenticated || !authResult.user) {
      console.error('[LinkedIn AI] Token verification failed');
      return { success: false, error: 'Invalid or expired token' };
    }

    // Store the complete auth data
    await setAuth({
      token: payload.token,
      expiresAt: payload.expiresAt,
      userId: authResult.user.id,
      name: authResult.user.name,
      email: authResult.user.email,
      accountStatus: authResult.user.accountStatus,
    });

    console.log('[LinkedIn AI] Auth token stored successfully for:', authResult.user.email);
    return { success: true };
  } catch (error) {
    console.error('[LinkedIn AI] Error storing auth token:', error);
    return { success: false, error: 'Failed to store authentication' };
  }
}
