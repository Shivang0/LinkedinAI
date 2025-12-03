import { setupMessageHandlers } from './message-handlers';

// Initialize background service worker
console.log('[LinkedIn AI] Background service worker initialized');

// Set up message handlers for content script communication
setupMessageHandlers();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[LinkedIn AI] Extension installed');
    // Could open onboarding page here
  } else if (details.reason === 'update') {
    console.log('[LinkedIn AI] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle extension uninstall
chrome.runtime.setUninstallURL('https://linekdin.vercel.app/extension/uninstall');
