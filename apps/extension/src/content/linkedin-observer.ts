import { extractPostData } from './post-detector';
import { injectCommentButton } from './button-injector';

/**
 * Observes the LinkedIn feed for new posts and injects AI comment buttons
 * Uses aggressive continuous scanning to catch all posts
 */
export class LinkedInObserver {
  private observer: MutationObserver | null = null;
  private processedPosts = new Set<string>();
  private scanInterval: number | null = null;
  private isScanning = false;

  /**
   * Start observing the LinkedIn feed
   */
  start(): void {
    if (this.observer) {
      console.warn('[LinkedIn AI] Observer already running');
      return;
    }

    console.log('[LinkedIn AI] Starting LinkedIn observer - aggressive mode');

    // Create mutation observer for DOM changes
    this.observer = new MutationObserver(() => {
      this.scanForPosts();
    });

    // Observe the entire document for any changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial scan
    this.scanForPosts();

    // Continuous scanning every 500ms to catch everything
    this.scanInterval = window.setInterval(() => {
      this.scanForPosts();
    }, 500);

    // Also scan on scroll
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Scan on any user interaction
    document.addEventListener('click', () => {
      setTimeout(() => this.scanForPosts(), 100);
    }, { passive: true });

    console.log('[LinkedIn AI] Observer started - scanning continuously');
  }

  private handleScroll = (): void => {
    this.scanForPosts();
  };

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    window.removeEventListener('scroll', this.handleScroll);
    console.log('[LinkedIn AI] Observer stopped');
  }

  /**
   * Scan the entire page for posts and inject buttons
   */
  private scanForPosts(): void {
    // Prevent concurrent scans
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      // Find ALL elements that have a Comment button - these are definitely posts
      const commentButtons = document.querySelectorAll('button[aria-label*="Comment"], button[aria-label*="comment"]');

      commentButtons.forEach((commentBtn) => {
        // Find the post container (ancestor with data-urn or a reasonable container)
        const postElement = this.findPostContainer(commentBtn as HTMLElement);

        if (!postElement) return;

        // Generate a unique ID for this post
        const postId = this.getPostId(postElement, commentBtn as HTMLElement);

        if (!postId || this.processedPosts.has(postId)) return;

        // Mark as processed
        this.processedPosts.add(postId);

        // Extract post data
        const postData = extractPostData(postElement, postId);

        if (!postData) {
          console.log('[LinkedIn AI] Could not extract data for post');
          return;
        }

        // Inject the button
        injectCommentButton(postElement, postData);
      });
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Find the post container element from a button inside it
   */
  private findPostContainer(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;

    // Walk up the DOM to find a suitable container
    while (current && current !== document.body) {
      // Check for data-urn attribute (LinkedIn's post identifier)
      if (current.hasAttribute('data-urn') || current.hasAttribute('data-id')) {
        return current;
      }

      // Check for common post container classes
      if (
        current.classList.contains('feed-shared-update-v2') ||
        current.classList.contains('occludable-update') ||
        current.classList.contains('feed-shared-card')
      ) {
        return current;
      }

      // Look for a reasonable container size (posts are usually fairly large)
      const rect = current.getBoundingClientRect();
      if (rect.height > 200 && rect.width > 400) {
        // Check if this element contains the post content structure
        if (current.querySelector('[class*="actor"]') || current.querySelector('[class*="author"]')) {
          return current;
        }
      }

      current = current.parentElement;
    }

    // Fallback: return the grandparent of the comment button's action bar
    const actionBar = element.parentElement;
    if (actionBar?.parentElement?.parentElement) {
      return actionBar.parentElement.parentElement;
    }

    return null;
  }

  /**
   * Get a unique ID for a post
   */
  private getPostId(postElement: HTMLElement, commentBtn: HTMLElement): string | null {
    // Try data-urn
    let id = postElement.getAttribute('data-urn');
    if (id) return id;

    // Try data-id
    id = postElement.getAttribute('data-id');
    if (id) return id;

    // Generate ID from position and content
    const rect = commentBtn.getBoundingClientRect();
    const textContent = postElement.textContent?.slice(0, 100) || '';
    const hash = this.simpleHash(textContent + rect.top);

    return `generated-${hash}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
