/**
 * Extension Bridge Client
 * Enables the web app to communicate with the LinkedIn AI Chrome extension
 * via the API bridge content script
 */

// Bridge action types
export type BridgeAction =
  | 'SYNC_ENGAGEMENT'
  | 'FETCH_MY_POSTS'
  | 'FETCH_PROFILE'
  | 'FETCH_USER_POSTS'
  | 'GET_AUTH_STATUS'
  | 'GET_LINKEDIN_CREDS'
  | 'PING';

// Types for bridge responses
export interface LinkedInPost {
  urn: string;
  text: string;
  postedAt: number;
  author: {
    name: string;
    profileUrl: string;
  };
  engagement: {
    numLikes: number;
    numComments: number;
    numShares: number;
    numImpressions?: number;
  };
  mediaUrls?: string[];
}

export interface LinkedInProfile {
  entityUrn: string;
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profilePicture?: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  posts: LinkedInPost[];
  error?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  hasCookies: boolean;
  hasCsrfToken: boolean;
}

// Timeout for bridge responses
const BRIDGE_TIMEOUT = 30000; // 30 seconds

// Track pending requests
const pendingRequests = new Map<
  string,
  {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }
>();

// Flag to track if listener is initialized
let listenerInitialized = false;

/**
 * Check if the extension is installed by looking for the bridge indicator
 */
export function isExtensionInstalled(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.getElementById('linkedin-ai-extension-bridge');
}

/**
 * Wait for extension to be ready
 */
export async function waitForExtension(maxWait: number = 5000): Promise<boolean> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      if (isExtensionInstalled()) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= maxWait) {
        resolve(false);
        return;
      }

      setTimeout(check, 100);
    };

    check();
  });
}

/**
 * Initialize the message listener for responses from the extension
 */
function initMessageListener(): void {
  if (listenerInitialized || typeof window === 'undefined') return;

  window.addEventListener('message', (event) => {
    // Only accept messages from our own window
    if (event.source !== window) return;

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      // Check if this is a bridge response
      if (data.requestId && pendingRequests.has(data.requestId)) {
        const pending = pendingRequests.get(data.requestId)!;
        clearTimeout(pending.timeout);
        pendingRequests.delete(data.requestId);

        if (data.success) {
          pending.resolve(data.data);
        } else {
          pending.reject(new Error(data.error || 'Bridge request failed'));
        }
      }
    } catch {
      // Not a valid bridge message, ignore
    }
  });

  listenerInitialized = true;
}

/**
 * Send a message to the extension via the bridge
 */
async function sendToExtension<T = any>(
  action: BridgeAction,
  payload?: any
): Promise<T> {
  // Initialize listener if needed
  initMessageListener();

  // Check if extension is installed
  if (!isExtensionInstalled()) {
    throw new Error('LinkedIn AI extension is not installed');
  }

  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();

    // Set timeout
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Extension bridge timeout'));
    }, BRIDGE_TIMEOUT);

    // Store pending request
    pendingRequests.set(requestId, { resolve, reject, timeout });

    // Send message
    const message = JSON.stringify({
      action,
      payload,
      requestId,
    });

    window.postMessage(message, '*');
  });
}

/**
 * Ping the extension to check if it's responsive
 */
export async function pingExtension(): Promise<boolean> {
  try {
    await sendToExtension('PING');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get LinkedIn authentication status
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  return sendToExtension<AuthStatus>('GET_AUTH_STATUS');
}

/**
 * Fetch current user's posts from LinkedIn
 */
export async function fetchMyPosts(count: number = 50): Promise<LinkedInPost[]> {
  return sendToExtension<LinkedInPost[]>('FETCH_MY_POSTS', { count });
}

/**
 * Fetch a LinkedIn profile by username
 */
export async function fetchProfile(username: string): Promise<LinkedInProfile> {
  return sendToExtension<LinkedInProfile>('FETCH_PROFILE', { username });
}

/**
 * Fetch posts from a specific user
 */
export async function fetchUserPosts(
  profileUrn: string,
  count: number = 20
): Promise<LinkedInPost[]> {
  return sendToExtension<LinkedInPost[]>('FETCH_USER_POSTS', {
    profileUrn,
    count,
  });
}

/**
 * Sync engagement data from LinkedIn to the backend
 */
export async function syncEngagement(): Promise<SyncResult> {
  return sendToExtension<SyncResult>('SYNC_ENGAGEMENT');
}

/**
 * Hook for React components to track extension state
 */
export function useExtensionStatus() {
  // This is a basic hook structure - can be expanded with React state
  return {
    isInstalled: isExtensionInstalled,
    waitForExtension,
    pingExtension,
    getAuthStatus,
  };
}
