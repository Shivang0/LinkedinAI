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

// LinkedIn selectors - Updated for 2024/2025 LinkedIn DOM
export const LINKEDIN_SELECTORS = {
  // Post container - comprehensive selectors for all post types
  POST_CONTAINER: [
    '[data-urn^="urn:li:activity"]',
    '[data-id^="urn:li:activity"]',
    '[data-urn^="urn:li:ugcPost"]',
    '[data-urn^="urn:li:share"]',
    '.feed-shared-update-v2',
    '.occludable-update',
    '.feed-shared-update-v2__content',
    'div[data-id*="urn:li"]',
    '.scaffold-finite-scroll__content > div',
    '.feed-shared-card',
    'article[data-urn]',
  ].join(', '),

  // Social actions bar (Like, Comment, Repost, Send) - multiple fallbacks
  SOCIAL_ACTIONS: [
    '.feed-shared-social-actions',
    '.social-details-social-actions',
    '[class*="social-actions"]',
    '.feed-shared-social-action-bar',
    '.social-actions-button',
    'div[class*="social-details"]',
  ].join(', '),

  // Comment button to insert after
  COMMENT_BUTTON: '[data-control-name="comment"], button[aria-label*="Comment"], button[aria-label*="comment"], button[class*="comment"]',

  // Post content - multiple fallbacks
  POST_CONTENT: [
    '.feed-shared-update-v2__description',
    '.feed-shared-text',
    '.feed-shared-inline-show-more-text',
    '.update-components-text',
    '[data-test-id="main-feed-activity-card__commentary"]',
    '.break-words',
    'span[dir="ltr"]',
    '.feed-shared-text-view',
  ].join(', '),

  // Author info - multiple fallbacks
  AUTHOR_NAME: [
    '.feed-shared-actor__name',
    '.update-components-actor__name',
    '.feed-shared-actor__title',
    '[class*="actor__name"]',
    '[class*="actor-name"]',
    'span.feed-shared-actor__name',
    'a[class*="app-aware-link"] span[dir="ltr"]',
  ].join(', '),

  AUTHOR_HEADLINE: [
    '.feed-shared-actor__description',
    '.update-components-actor__description',
    '.feed-shared-actor__sub-description',
    '[class*="actor__description"]',
    'span.feed-shared-actor__description',
  ].join(', '),

  // Comment box for inserting generated comments
  COMMENT_BOX: '.comments-comment-texteditor__contenteditable, [data-placeholder*="Add a comment"], .ql-editor, [contenteditable="true"][role="textbox"]',
} as const;

// Comment generation options
export const COMMENT_TONES = ['professional', 'casual', 'supportive', 'curious', 'humorous', 'thought-provoking', 'inspirational'] as const;
export const COMMENT_STYLES = ['agree', 'add-value', 'question', 'personal-story'] as const;
export const COMMENT_LENGTHS = ['short', 'medium', 'long'] as const;
export const CTA_TYPES = ['none', 'question', 'soft'] as const;

export type CommentTone = typeof COMMENT_TONES[number];
export type CommentStyle = typeof COMMENT_STYLES[number];
export type CommentLength = typeof COMMENT_LENGTHS[number];
export type CtaType = typeof CTA_TYPES[number];

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
