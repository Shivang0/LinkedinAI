/**
 * Content script that runs on the authorize page to capture the auth token
 * and send it to the extension's background script.
 */

console.log('[LinkedIn AI] Auth capture script loaded');

// Function to parse the token from URL hash
function parseTokenFromHash(): { token: string; expiresAt: number } | null {
  const hash = window.location.hash;
  if (!hash || !hash.includes('token=')) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(1)); // Remove the # character
  const token = params.get('token');
  const expiresAt = params.get('expiresAt');

  if (!token || !expiresAt) {
    return null;
  }

  return {
    token,
    expiresAt: parseInt(expiresAt, 10),
  };
}

// Function to capture and store the token
async function captureToken(): Promise<void> {
  const tokenData = parseTokenFromHash();

  if (!tokenData) {
    console.log('[LinkedIn AI] No token found in URL hash');
    return;
  }

  console.log('[LinkedIn AI] Token found, storing in extension...');

  try {
    // Send the token to the background script for storage
    const response = await chrome.runtime.sendMessage({
      type: 'STORE_AUTH_TOKEN',
      payload: tokenData,
    });

    if (response && response.success) {
      console.log('[LinkedIn AI] Token stored successfully!');
      // Show success message to user
      showSuccessMessage();
    } else {
      console.error('[LinkedIn AI] Failed to store token:', response?.error);
    }
  } catch (error) {
    console.error('[LinkedIn AI] Error storing token:', error);
  }
}

// Show success message in the page
function showSuccessMessage(): void {
  // The page already shows success, but we can enhance it
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #63c74d;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  banner.textContent = 'Extension connected! You can close this tab.';
  document.body.appendChild(banner);

  // Auto-remove after 5 seconds
  setTimeout(() => banner.remove(), 5000);
}

// Watch for hash changes (in case it's set after page load)
function watchForToken(): void {
  // Check immediately
  captureToken();

  // Also watch for hash changes
  window.addEventListener('hashchange', () => {
    console.log('[LinkedIn AI] Hash changed, checking for token...');
    captureToken();
  });

  // Also poll for a short while in case the token is set with a delay
  let attempts = 0;
  const maxAttempts = 10;
  const interval = setInterval(() => {
    attempts++;
    const tokenData = parseTokenFromHash();
    if (tokenData) {
      clearInterval(interval);
      captureToken();
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 500);
}

// Start watching for the token
watchForToken();
