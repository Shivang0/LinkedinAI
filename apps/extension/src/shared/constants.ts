// API configuration
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://linekdin.vercel.app/api'
  : 'http://localhost:3000/api';

// Extension configuration
export const EXTENSION_NAME = 'LinkedIn AI Comments';
export const EXTENSION_VERSION = '1.0.0';

// Auth configuration
export const AUTH_STORAGE_KEY = 'linkedin_ai_auth';
export const TOKEN_REFRESH_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours before expiry

// LinkedIn selectors
export const LINKEDIN_SELECTORS = {
  // Post container
  POST_CONTAINER: '[data-urn^="urn:li:activity"]',

  // Social actions bar (Like, Comment, Repost, Send)
  SOCIAL_ACTIONS: '.feed-shared-social-actions, .social-details-social-actions',

  // Comment button to insert after
  COMMENT_BUTTON: '[data-control-name="comment"], button[aria-label*="Comment"]',

  // Post content
  POST_CONTENT: '.feed-shared-update-v2__description, .feed-shared-text, .feed-shared-inline-show-more-text',

  // Author info
  AUTHOR_NAME: '.feed-shared-actor__name, .update-components-actor__name',
  AUTHOR_HEADLINE: '.feed-shared-actor__description, .update-components-actor__description',

  // Comment box for inserting generated comments
  COMMENT_BOX: '.comments-comment-texteditor__contenteditable, [data-placeholder*="Add a comment"], .ql-editor',
} as const;

// Comment generation options
export const COMMENT_TONES = ['professional', 'casual', 'supportive', 'curious'] as const;
export const COMMENT_STYLES = ['agree', 'add-value', 'question', 'personal-story'] as const;
export const COMMENT_LENGTHS = ['short', 'medium'] as const;

export type CommentTone = typeof COMMENT_TONES[number];
export type CommentStyle = typeof COMMENT_STYLES[number];
export type CommentLength = typeof COMMENT_LENGTHS[number];

// Theme colors (matching main app)
export const THEME = {
  primary: '#e43b44',      // retro-red
  secondary: '#63c74d',    // retro-green
  accent: '#feae34',       // retro-yellow
  info: '#0099db',         // retro-blue
  background: '#1a1c2c',   // retro-black
  surface: '#262b44',      // retro-dark-blue
  border: '#f4f4f4',       // retro-white
  text: '#f4f4f4',
  textMuted: '#94a3b8',
} as const;
