import { LINKEDIN_SELECTORS } from '@/shared/constants';
import type { LinkedInPostContext } from '@/shared/types/messages';

/**
 * Extract post data from a LinkedIn post element
 * Uses fallback iteration - tries each selector until content is found
 */
export function extractPostData(postElement: HTMLElement, urn: string): LinkedInPostContext | null {
  try {
    // First, expand "see more" if present to get full content
    const seeMoreSelectors = [
      'button.see-more',
      '.feed-shared-inline-show-more-text__see-more-less-toggle',
      '[data-tracking-control-name*="see_more"]',
      'button[aria-label*="see more"]',
    ];

    for (const selector of seeMoreSelectors) {
      const seeMoreBtn = postElement.querySelector(selector) as HTMLElement;
      if (seeMoreBtn && seeMoreBtn.textContent?.toLowerCase().includes('more')) {
        try {
          seeMoreBtn.click();
          console.log('[LinkedIn AI] Clicked "see more" to expand content');
        } catch (e) {
          // Ignore click errors
        }
        break;
      }
    }

    // Extract post content with fallback iteration - try innerText first
    let content = '';
    let foundSelector = '';

    for (const selector of LINKEDIN_SELECTORS.POST_CONTENT) {
      const element = postElement.querySelector(selector) as HTMLElement;
      if (element) {
        // Try innerText first (cleaner, no hidden text), fallback to textContent
        const text = element.innerText || element.textContent || '';
        if (text.trim().length > 20) {  // Minimum 20 chars for valid content
          content = cleanPostContent(text);
          foundSelector = selector;
          break;
        }
      }
    }

    // Skip posts without content
    if (!content || content.length < 20) {
      console.warn('[LinkedIn AI] Content too short or empty for post:', urn, '- length:', content.length);
      return null;
    }

    console.log('[LinkedIn AI] Selector used:', foundSelector);
    console.log('[LinkedIn AI] Content length:', content.length);
    console.log('[LinkedIn AI] Content preview:', content.slice(0, 200) + '...');

    // Extract author name with fallback iteration
    let author = 'Unknown';
    for (const selector of LINKEDIN_SELECTORS.AUTHOR_NAME) {
      const element = postElement.querySelector(selector);
      if (element && element.textContent?.trim()) {
        author = element.textContent.trim();
        break;
      }
    }

    // Extract author headline with fallback iteration
    let authorHeadline: string | undefined;
    for (const selector of LINKEDIN_SELECTORS.AUTHOR_HEADLINE) {
      const element = postElement.querySelector(selector);
      if (element && element.textContent?.trim()) {
        authorHeadline = element.textContent.trim();
        break;
      }
    }

    return {
      urn,
      content,
      author,
      authorHeadline,
    };
  } catch (error) {
    console.error('[LinkedIn AI] Error extracting post data:', error);
    return null;
  }
}

/**
 * Clean up post content text
 */
function cleanPostContent(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/…see more/gi, '')  // Remove "see more" text
    .replace(/…/g, '...')  // Normalize ellipsis
    .trim()
    .slice(0, 3000);  // Limit to 3000 characters
}

/**
 * Find the social actions bar for a post
 */
export function findSocialActionsBar(postElement: HTMLElement): HTMLElement | null {
  return postElement.querySelector(LINKEDIN_SELECTORS.SOCIAL_ACTIONS);
}

/**
 * Find the comment input box for a post
 */
export function findCommentBox(postElement: HTMLElement): HTMLElement | null {
  return postElement.querySelector(LINKEDIN_SELECTORS.COMMENT_BOX);
}

/**
 * Insert text into a LinkedIn comment box
 */
export function insertIntoCommentBox(commentBox: HTMLElement, text: string): boolean {
  try {
    // Focus the editor
    commentBox.focus();

    // Clear existing content
    commentBox.textContent = '';

    // Insert the text
    document.execCommand('insertText', false, text);

    // Dispatch input event to trigger LinkedIn's state update
    commentBox.dispatchEvent(new Event('input', { bubbles: true }));
    commentBox.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  } catch (error) {
    console.error('[LinkedIn AI] Error inserting into comment box:', error);
    return false;
  }
}
