import { LinkedInObserver } from './linkedin-observer';

// Initialize content script
console.log('[LinkedIn AI] Content script loaded');

// Start observing LinkedIn feed for posts
const observer = new LinkedInObserver();
observer.start();

// Cleanup on page unload
window.addEventListener('unload', () => {
  observer.stop();
});
