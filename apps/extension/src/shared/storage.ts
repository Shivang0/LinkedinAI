import { AUTH_STORAGE_KEY } from './constants';

export interface AuthStorage {
  token: string;
  expiresAt: number;
  userId: string;
  name: string;
  email: string;
  accountStatus: string;
}

/**
 * Get authentication data from storage
 */
export async function getAuth(): Promise<AuthStorage | null> {
  try {
    const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    const auth = result[AUTH_STORAGE_KEY] as AuthStorage | undefined;

    if (!auth) return null;

    // Check if token is expired
    if (Date.now() > auth.expiresAt) {
      await clearAuth();
      return null;
    }

    return auth;
  } catch (error) {
    console.error('Error getting auth from storage:', error);
    return null;
  }
}

/**
 * Get just the auth token
 */
export async function getAuthToken(): Promise<string | null> {
  const auth = await getAuth();
  return auth?.token ?? null;
}

/**
 * Save authentication data to storage
 */
export async function setAuth(auth: AuthStorage): Promise<void> {
  try {
    await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: auth });
  } catch (error) {
    console.error('Error saving auth to storage:', error);
    throw error;
  }
}

/**
 * Clear authentication data from storage
 */
export async function clearAuth(): Promise<void> {
  try {
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing auth from storage:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated with active subscription
 */
export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuth();
  return auth !== null && auth.accountStatus === 'active';
}

/**
 * Check if token needs refresh (within threshold of expiry)
 */
export async function needsTokenRefresh(thresholdMs: number = 2 * 60 * 60 * 1000): Promise<boolean> {
  const auth = await getAuth();
  if (!auth) return false;

  const timeUntilExpiry = auth.expiresAt - Date.now();
  return timeUntilExpiry > 0 && timeUntilExpiry < thresholdMs;
}

/**
 * Get user info from storage
 */
export async function getUserInfo(): Promise<{ name: string; email: string; accountStatus: string } | null> {
  const auth = await getAuth();
  if (!auth) return null;

  return {
    name: auth.name,
    email: auth.email,
    accountStatus: auth.accountStatus,
  };
}
