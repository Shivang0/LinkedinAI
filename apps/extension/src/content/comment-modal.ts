import type { LinkedInPostContext, GenerateCommentResponse } from '@/shared/types/messages';
import { sendMessage } from '@/shared/types/messages';
import type { CommentTone, CommentStyle, CommentLength } from '@/shared/constants';
import { COMMENT_TONES, COMMENT_STYLES } from '@/shared/constants';
import { findCommentBox, insertIntoCommentBox } from './post-detector';

let currentModal: HTMLElement | null = null;

interface ModalState {
  postData: LinkedInPostContext;
  tone: CommentTone;
  style: CommentStyle;
  length: CommentLength;
  isLoading: boolean;
  error: string | null;
  comment: string | null;
  alternatives: string[];
  isAuthenticated: boolean;
}

/**
 * Show the comment generation modal
 */
export async function showCommentModal(postData: LinkedInPostContext, anchorButton: HTMLElement): Promise<void> {
  // Close existing modal if any
  closeModal();

  // Check authentication first
  const authResult = await sendMessage({ type: 'CHECK_AUTH', payload: undefined });

  // Create initial state
  const state: ModalState = {
    postData,
    tone: 'professional',
    style: 'add-value',
    length: 'short',
    isLoading: false,
    error: null,
    comment: null,
    alternatives: [],
    isAuthenticated: authResult.authenticated,
  };

  // Create and show modal
  currentModal = createModal(state, anchorButton);
  document.body.appendChild(currentModal);
}

/**
 * Close the modal
 */
function closeModal(): void {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
}

/**
 * Create the modal element
 */
function createModal(state: ModalState, anchorButton: HTMLElement): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'linkedin-ai-modal-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const modal = document.createElement('div');
  modal.className = 'linkedin-ai-modal';

  // Render modal content
  renderModalContent(modal, state, anchorButton);

  overlay.appendChild(modal);
  return overlay;
}

/**
 * Render modal content based on state
 */
function renderModalContent(modal: HTMLElement, state: ModalState, anchorButton: HTMLElement): void {
  modal.innerHTML = `
    <div class="linkedin-ai-modal-header">
      <div class="linkedin-ai-modal-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L3 9l9 6 9-6-9-6z"/>
        </svg>
        AI COMMENT
      </div>
      <button class="linkedin-ai-modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="linkedin-ai-modal-body">
      ${!state.isAuthenticated ? renderAuthPrompt() : renderMainContent(state)}
    </div>
    ${state.isAuthenticated ? renderFooter(state) : ''}
  `;

  // Add event listeners
  setupEventListeners(modal, state, anchorButton);
}

/**
 * Render auth prompt for unauthenticated users
 */
function renderAuthPrompt(): string {
  return `
    <div class="linkedin-ai-auth-prompt">
      <h3>SIGN IN REQUIRED</h3>
      <p>Connect your LinkedIn AI account to generate personalized comments.</p>
      <button class="linkedin-ai-btn linkedin-ai-btn-primary linkedin-ai-login-btn">
        Sign In
      </button>
    </div>
  `;
}

/**
 * Render main content for authenticated users
 */
function renderMainContent(state: ModalState): string {
  return `
    <div class="linkedin-ai-section">
      <div class="linkedin-ai-section-label">Tone</div>
      <div class="linkedin-ai-tone-buttons">
        ${COMMENT_TONES.map(tone => `
          <button class="linkedin-ai-tone-btn ${state.tone === tone ? 'active' : ''}" data-tone="${tone}">
            ${tone.charAt(0).toUpperCase() + tone.slice(1)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="linkedin-ai-section">
      <div class="linkedin-ai-section-label">Style</div>
      <div class="linkedin-ai-tone-buttons">
        ${COMMENT_STYLES.map(style => `
          <button class="linkedin-ai-tone-btn ${state.style === style ? 'active' : ''}" data-style="${style}">
            ${formatStyleLabel(style)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="linkedin-ai-section">
      <div class="linkedin-ai-section-label">Preview</div>
      ${state.isLoading ? renderLoading() : ''}
      ${state.error ? renderError(state.error) : ''}
      ${!state.isLoading && !state.error ? renderPreview(state) : ''}
    </div>

    ${state.alternatives.length > 0 ? renderAlternatives(state.alternatives) : ''}
  `;
}

/**
 * Render loading state
 */
function renderLoading(): string {
  return `
    <div class="linkedin-ai-loading">
      <div class="linkedin-ai-loading-spinner"></div>
      <span>Generating comment...</span>
    </div>
  `;
}

/**
 * Render error state
 */
function renderError(error: string): string {
  return `
    <div class="linkedin-ai-error">
      <span>&#9888;</span>
      <span>${error}</span>
    </div>
  `;
}

/**
 * Render comment preview
 */
function renderPreview(state: ModalState): string {
  if (!state.comment) {
    return `
      <div class="linkedin-ai-preview">
        <span class="linkedin-ai-preview-placeholder">
          Click "Generate" to create a comment for this post.
        </span>
      </div>
    `;
  }

  return `
    <div class="linkedin-ai-preview">
      ${state.comment}
    </div>
  `;
}

/**
 * Render alternatives section
 */
function renderAlternatives(alternatives: string[]): string {
  return `
    <div class="linkedin-ai-alternatives">
      <div class="linkedin-ai-alternatives-label">Alternatives (click to use):</div>
      ${alternatives.map((alt, i) => `
        <div class="linkedin-ai-alternative" data-alternative="${i}">
          ${alt}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render footer with action buttons
 */
function renderFooter(state: ModalState): string {
  return `
    <div class="linkedin-ai-modal-footer">
      <button class="linkedin-ai-btn linkedin-ai-btn-secondary linkedin-ai-regenerate-btn" ${state.isLoading ? 'disabled' : ''}>
        ${state.comment ? 'Regenerate' : 'Generate'}
      </button>
      <div>
        <button class="linkedin-ai-btn linkedin-ai-btn-secondary linkedin-ai-copy-btn" ${!state.comment || state.isLoading ? 'disabled' : ''}>
          Copy
        </button>
        <button class="linkedin-ai-btn linkedin-ai-btn-primary linkedin-ai-insert-btn" ${!state.comment || state.isLoading ? 'disabled' : ''}>
          Insert
        </button>
      </div>
    </div>
  `;
}

/**
 * Set up event listeners for modal interactions
 */
function setupEventListeners(modal: HTMLElement, state: ModalState, anchorButton: HTMLElement): void {
  // Close button
  modal.querySelector('.linkedin-ai-modal-close')?.addEventListener('click', closeModal);

  // Login button
  modal.querySelector('.linkedin-ai-login-btn')?.addEventListener('click', async () => {
    await sendMessage({ type: 'LOGIN', payload: undefined });
    closeModal();
  });

  // Tone buttons
  modal.querySelectorAll('[data-tone]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tone = (btn as HTMLElement).dataset.tone as CommentTone;
      renderModalContent(modal, state, anchorButton);
    });
  });

  // Style buttons
  modal.querySelectorAll('[data-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.style = (btn as HTMLElement).dataset.style as CommentStyle;
      renderModalContent(modal, state, anchorButton);
    });
  });

  // Generate/Regenerate button
  modal.querySelector('.linkedin-ai-regenerate-btn')?.addEventListener('click', async () => {
    await generateComment(modal, state, anchorButton);
  });

  // Copy button
  modal.querySelector('.linkedin-ai-copy-btn')?.addEventListener('click', () => {
    if (state.comment) {
      navigator.clipboard.writeText(state.comment);
      // Could show a toast here
    }
  });

  // Insert button
  modal.querySelector('.linkedin-ai-insert-btn')?.addEventListener('click', () => {
    if (state.comment) {
      insertComment(state.comment, anchorButton);
      closeModal();
    }
  });

  // Alternative selection
  modal.querySelectorAll('[data-alternative]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt((btn as HTMLElement).dataset.alternative || '0', 10);
      if (state.alternatives[index]) {
        state.comment = state.alternatives[index];
        renderModalContent(modal, state, anchorButton);
      }
    });
  });
}

/**
 * Generate a comment
 */
async function generateComment(modal: HTMLElement, state: ModalState, anchorButton: HTMLElement): Promise<void> {
  state.isLoading = true;
  state.error = null;
  renderModalContent(modal, state, anchorButton);

  const response: GenerateCommentResponse = await sendMessage({
    type: 'GENERATE_COMMENT',
    payload: {
      postContent: state.postData.content,
      postAuthor: state.postData.author,
      postAuthorHeadline: state.postData.authorHeadline,
      tone: state.tone,
      style: state.style,
      length: state.length,
    },
  });

  state.isLoading = false;

  if (response.success && response.comment) {
    state.comment = response.comment;
    state.alternatives = response.alternatives || [];
  } else {
    state.error = response.error || 'Failed to generate comment';
  }

  renderModalContent(modal, state, anchorButton);
}

/**
 * Insert comment into LinkedIn comment box
 */
function insertComment(comment: string, anchorButton: HTMLElement): void {
  // Find the post element
  const postElement = anchorButton.closest('[data-urn]') as HTMLElement;
  if (!postElement) {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(comment);
    return;
  }

  // Find and click the comment button to open comment box
  const commentButton = postElement.querySelector('[data-control-name="comment"], button[aria-label*="Comment"]') as HTMLElement;
  if (commentButton) {
    commentButton.click();

    // Wait for comment box to appear, then insert
    setTimeout(() => {
      const commentBox = findCommentBox(postElement);
      if (commentBox) {
        insertIntoCommentBox(commentBox, comment);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(comment);
      }
    }, 500);
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(comment);
  }
}

/**
 * Format style label for display
 */
function formatStyleLabel(style: CommentStyle): string {
  const labels: Record<CommentStyle, string> = {
    'agree': 'Agree',
    'add-value': 'Add Value',
    'question': 'Question',
    'personal-story': 'Story',
  };
  return labels[style] || style;
}
