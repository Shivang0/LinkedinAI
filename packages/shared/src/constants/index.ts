// Content limits
export const CONTENT_LIMITS = {
  MAX_POST_LENGTH: 3000,
  IDEAL_POST_LENGTH_MIN: 150,
  IDEAL_POST_LENGTH_MAX: 1300,
  MAX_HASHTAGS: 5,
  MAX_EMOJIS: 3,
} as const;

// Subscription plans
export const PLANS = {
  MONTHLY: {
    name: 'Premium Monthly',
    price: 19,
    interval: 'month',
  },
  ANNUAL: {
    name: 'Premium Annual',
    price: 190,
    interval: 'year',
    savings: 38,
  },
} as const;

// Tone options
export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
  { value: 'storytelling', label: 'Storytelling' },
] as const;

// Format options
export const FORMAT_OPTIONS = [
  { value: 'story', label: 'Personal Story' },
  { value: 'listicle', label: 'List/Tips' },
  { value: 'question', label: 'Question-based' },
  { value: 'opinion', label: 'Opinion/Hot Take' },
  { value: 'how-to', label: 'How-to Guide' },
  { value: 'announcement', label: 'Announcement' },
] as const;

// Hook style options
export const HOOK_STYLE_OPTIONS = [
  { value: 'question', label: 'Question Hook' },
  { value: 'statistic', label: 'Statistic/Number' },
  { value: 'bold-statement', label: 'Bold Statement' },
  { value: 'personal-story', label: 'Personal Story' },
  { value: 'contrarian', label: 'Contrarian View' },
] as const;

// Length options
export const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (100-200 words)' },
  { value: 'medium', label: 'Medium (200-400 words)' },
  { value: 'long', label: 'Long (400-600 words)' },
] as const;

// API endpoints
export const API_ROUTES = {
  AUTH: {
    LINKEDIN: '/api/auth/linkedin',
    CALLBACK: '/api/auth/callback',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  BILLING: {
    CHECKOUT: '/api/billing/checkout',
    PORTAL: '/api/billing/portal',
    WEBHOOK: '/api/webhooks/stripe',
  },
  POSTS: {
    LIST: '/api/posts',
    CREATE: '/api/posts',
    GENERATE: '/api/posts/generate',
    GET: (id: string) => `/api/posts/${id}`,
    UPDATE: (id: string) => `/api/posts/${id}`,
    DELETE: (id: string) => `/api/posts/${id}`,
  },
  DRAFTS: {
    LIST: '/api/drafts',
    CREATE: '/api/drafts',
    GET: (id: string) => `/api/drafts/${id}`,
    UPDATE: (id: string) => `/api/drafts/${id}`,
    DELETE: (id: string) => `/api/drafts/${id}`,
  },
  SCHEDULE: {
    LIST: '/api/schedule',
    CREATE: '/api/schedule',
    UPDATE: (id: string) => `/api/schedule/${id}`,
    DELETE: (id: string) => `/api/schedule/${id}`,
  },
  TEMPLATES: {
    LIST: '/api/templates',
    CREATE: '/api/templates',
    GET: (id: string) => `/api/templates/${id}`,
    UPDATE: (id: string) => `/api/templates/${id}`,
    DELETE: (id: string) => `/api/templates/${id}`,
  },
  PROFILE: {
    GET: '/api/profile',
    ANALYZE: '/api/profile/analyze',
  },
  MEDIA: {
    UPLOAD: '/api/media/upload',
    LIST: '/api/media',
    DELETE: (id: string) => `/api/media/${id}`,
  },
} as const;
