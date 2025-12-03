import { LINKEDIN_SELECTORS } from '@/shared/constants';
import type { LinkedInPostContext } from '@/shared/types/messages';
import { showCommentModal } from './comment-modal';

/**
 * Inject the AI comment button into a post's social actions bar
 */
export function injectCommentButton(postElement: HTMLElement, postData: LinkedInPostContext): void {
  // Find the social actions bar
  const actionsBar = postElement.querySelector(LINKEDIN_SELECTORS.SOCIAL_ACTIONS);
  if (!actionsBar) {
    return;
  }

  // Check if button already exists
  if (actionsBar.querySelector('.linkedin-ai-comment-btn')) {
    return;
  }

  // Create the AI comment button
  const button = createAIButton(postData);

  // Insert the button into the actions bar
  actionsBar.appendChild(button);
}

/**
 * Create the AI comment button element
 */
function createAIButton(postData: LinkedInPostContext): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'linkedin-ai-comment-btn';
  button.setAttribute('data-post-urn', postData.urn);
  button.setAttribute('type', 'button');

  button.innerHTML = `
    <span class="linkedin-ai-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3L3 9l9 6 9-6-9-6z"/>
        <path d="M3 9v6l9 6 9-6V9"/>
        <path d="M12 15v6"/>
      </svg>
    </span>
    <span class="linkedin-ai-label">AI</span>
  `;

  // Add click handler
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await showCommentModal(postData, button);
  });

  return button;
}

/**
 * Remove AI comment button from a post
 */
export function removeCommentButton(postElement: HTMLElement): void {
  const button = postElement.querySelector('.linkedin-ai-comment-btn');
  if (button) {
    button.remove();
  }
}
