import { z } from 'zod';

// Re-export z for use in other packages
export { z };

// Emoji level enum
export const emojiLevelSchema = z.enum(['none', 'light', 'moderate', 'heavy']);

// Generation params validation
export const generationParamsSchema = z.object({
  topic: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  tone: z.enum(['professional', 'casual', 'inspirational', 'educational', 'storytelling']).optional(),
  format: z.enum(['story', 'listicle', 'question', 'opinion', 'how-to', 'announcement']).optional(),
  hookStyle: z.enum(['question', 'statistic', 'bold-statement', 'personal-story', 'contrarian']).optional(),
  includeCallToAction: z.boolean().optional(),
  targetAudience: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  emojiLevel: emojiLevelSchema.optional().default('none'),
});

export type GenerationParamsInput = z.infer<typeof generationParamsSchema>;

// Post validation
export const createPostSchema = z.object({
  content: z.string().min(1).max(3000),
  aiGenerated: z.boolean().optional().default(false),
  generationPrompt: z.string().optional(),
  templateId: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Schedule validation
export const schedulePostSchema = z.object({
  postId: z.string(),
  scheduledFor: z.string().datetime(),
  timezone: z.string().optional().default('UTC'),
  isRecurring: z.boolean().optional().default(false),
  recurringConfig: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().int().min(1).optional().default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

export type SchedulePostInput = z.infer<typeof schedulePostSchema>;

// Draft validation
export const createDraftSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
});

export type CreateDraftInput = z.infer<typeof createDraftSchema>;

export const updateDraftSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});

export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;

// Template validation
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().optional(),
  contentTemplate: z.string().min(1),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    defaultValue: z.string().optional(),
  })).optional().default([]),
  tone: z.string().optional(),
  format: z.string().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

// Checkout validation
export const createCheckoutSchema = z.object({
  priceId: z.string(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
