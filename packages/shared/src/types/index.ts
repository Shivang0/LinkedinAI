export interface User {
  id: string;
  linkedinId: string;
  email: string;
  name: string;
  headline?: string | null;
  industry?: string | null;
  profileUrl?: string | null;
  profileImageUrl?: string | null;
  accountStatus: 'pending_payment' | 'active' | 'suspended' | 'canceled';
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: 'premium_monthly' | 'premium_annual';
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  linkedinPostId?: string | null;
  linkedinPostUrl?: string | null;
  aiGenerated: boolean;
  generationPrompt?: string | null;
}

export interface Draft {
  id: string;
  userId: string;
  title?: string | null;
  content: string;
  lastAutoSaveAt: Date;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  contentTemplate: string;
  variables: TemplateVariable[];
  tone?: string | null;
  format?: string | null;
}

export interface TemplateVariable {
  name: string;
  description?: string;
  defaultValue?: string;
}

export type EmojiLevel = 'none' | 'light' | 'moderate' | 'heavy';
export type HashtagUsage = 'minimal' | 'moderate' | 'heavy';

export interface ProfileAnalysis {
  id: string;
  userId: string;

  // Basic Professional Info
  industry?: string | null;
  position?: string | null;
  yearsExperience?: number | null;
  company?: string | null;

  // Content & Writing
  expertise: string[];
  writingStyle?: string | null;
  topicsOfInterest: string[];

  // Content Preferences
  emojiPreference?: EmojiLevel | null;
  hashtagUsage?: HashtagUsage | null;

  // Audience & Goals
  targetAudience?: string | null;
  contentStrengths: string[];
  personalValues: string[];

  audienceProfile?: AudienceProfile | null;
}

export interface AudienceProfile {
  seniority?: string[];
  functions?: string[];
  industries?: string[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Session types
export interface Session {
  userId: string;
  email: string;
  name: string;
  profileImageUrl?: string | null;
  accountStatus: User['accountStatus'];
  subscription?: {
    plan: Subscription['plan'];
    status: Subscription['status'];
    currentPeriodEnd: Date;
  } | null;
}

// AI Generation types
export interface GenerationParams {
  topic?: string;
  keyPoints?: string[];
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational' | 'storytelling';
  format?: 'story' | 'listicle' | 'question' | 'opinion' | 'how-to' | 'announcement';
  hookStyle?: 'question' | 'statistic' | 'bold-statement' | 'personal-story' | 'contrarian';
  includeCallToAction?: boolean;
  targetAudience?: string;
  length?: 'short' | 'medium' | 'long';
  emojiLevel?: EmojiLevel;
  autoFormat?: boolean;
}

export interface GeneratedContent {
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
    generatedAt: Date;
  };
}
