import { LINKEDIN_SELECTORS } from '@/shared/constants';
import { extractPostData } from './post-detector';
import { injectCommentButton } from './button-injector';

/**
 * Observes the LinkedIn feed for new posts and injects AI comment buttons
 */
export class LinkedInObserver {
  private observer: MutationObserver | null = null;
  private processedPosts = new Set<string>();

  /**
   * Start observing the LinkedIn feed
   */
  start(): void {
    if (this.observer) {
      console.warn('[LinkedIn AI] Observer already running');
      return;
    }

    console.log('[LinkedIn AI] Starting LinkedIn observer');

    // Create mutation observer
    this.observer = new MutationObserver(this.handleMutations.bind(this));

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Process posts already on the page
    this.processExistingPosts();
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('[LinkedIn AI] LinkedIn observer stopped');
    }
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          this.findAndProcessPosts(node);
        }
      }
    }
  }

  /**
   * Process posts already on the page
   */
  private processExistingPosts(): void {
    this.findAndProcessPosts(document.body);
  }

  /**
   * Find and process posts within an element
   */
  private findAndProcessPosts(root: HTMLElement): void {
    // Find all post containers
    const posts = root.querySelectorAll<HTMLElement>(LINKEDIN_SELECTORS.POST_CONTAINER);

    // Also check if root itself is a post
    if (root.matches(LINKEDIN_SELECTORS.POST_CONTAINER)) {
      this.processPost(root);
    }

    posts.forEach((post) => this.processPost(post));
  }

  /**
   * Process a single post element
   */
  private processPost(element: HTMLElement): void {
    const urn = element.getAttribute('data-urn');

    // Skip if no URN or already processed
    if (!urn || this.processedPosts.has(urn)) {
      return;
    }

    // Mark as processed
    this.processedPosts.add(urn);

    // Extract post data
    const postData = extractPostData(element, urn);
    if (!postData) {
      console.log('[LinkedIn AI] Could not extract post data for:', urn);
      return;
    }

    // Inject the AI comment button
    injectCommentButton(element, postData);
  }
}
