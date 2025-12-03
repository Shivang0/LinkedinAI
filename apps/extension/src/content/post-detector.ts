import { LINKEDIN_SELECTORS } from '@/shared/constants';
import type { LinkedInPostContext } from '@/shared/types/messages';

/**
 * Extract post data from a LinkedIn post element
 */
export function extractPostData(postElement: HTMLElement, urn: string): LinkedInPostContext | null {
  try {
    // Extract post content
    const contentElement = postElement.querySelector(LINKEDIN_SELECTORS.POST_CONTENT);
    const content = cleanPostContent(contentElement?.textContent || '');

    // Skip posts without content
    if (!content || content.length < 10) {
      return null;
    }

    // Extract author name
    const authorElement = postElement.querySelector(LINKEDIN_SELECTORS.AUTHOR_NAME);
    const author = authorElement?.textContent?.trim() || 'Unknown';

    // Extract author headline
    const headlineElement = postElement.querySelector(LINKEDIN_SELECTORS.AUTHOR_HEADLINE);
    const authorHeadline = headlineElement?.textContent?.trim();

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
