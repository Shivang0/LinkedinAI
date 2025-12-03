import type { GenerationParams, ProfileAnalysis, EmojiLevel } from '@linkedin-ai/shared';
import { BANNED_WORDS } from './content-rules';

/**
 * Hybrid JSON/Natural Language prompt configuration for post generation
 * Reduces token usage by ~60% while maintaining quality
 */
const POST_CONFIG = {
  role: "LinkedIn post writer (AS user, not FOR user)",
  goal: "Authentic, human-sounding content",
  rules: {
    never: [
      "em-dashes (—)",
      "Start with: 'In today's world', 'Here's why', 'I wanted to share'",
      "Generic numbered lists without context",
      "Corporate jargon and buzzwords"
    ],
    always: [
      "Contractions (I'm, you're, don't, can't)",
      "Varied sentence length (mix short punchy + longer)",
      "First person + direct 'you'",
      "Line breaks between thoughts",
      "Personal anecdotes with specifics",
      "Opinions, not just facts"
    ],
    banned_words: BANNED_WORDS.slice(0, 15)
  },
  structure: ["Hook (scroll-stopper)", "Body (skimmable)", "Takeaway", "CTA/Question"],
  format: {
    paragraphs: "1-3 sentences max",
    hashtags: "3-5 at end",
    emojis: "0-3 max unless specified"
  }
};

/**
 * Emoji level mapping - concise
 */
const EMOJI_MAP: Record<EmojiLevel, string> = {
  none: "0 emojis",
  light: "1-2 emojis",
  moderate: "3-5 emojis",
  heavy: "6+ emojis"
};

/**
 * Tone descriptions - concise for token efficiency
 */
const TONE_MAP: Record<string, string> = {
  professional: "Expert but approachable",
  casual: "Friendly, personal stories",
  inspirational: "Real struggles + lessons",
  educational: "Practical takeaways",
  storytelling: "Narrative with tension"
};

/**
 * Format guidance - concise
 */
const FORMAT_MAP: Record<string, string> = {
  story: "Personal story with lesson",
  listicle: "Points with context, not generic",
  question: "Thought-provoking question explored",
  opinion: "Hot take with reasoning",
  'how-to': "Practical guide from experience",
  announcement: "News + why it matters"
};

/**
 * Hook style guidance - concise
 */
const HOOK_MAP: Record<string, string> = {
  question: "Provocative/relatable question",
  statistic: "Surprising number/stat",
  'bold-statement': "Strong opinion/contrarian view",
  'personal-story': "Start with 'I' + specific moment",
  contrarian: "Challenge common assumption"
};

/**
 * Length guidance
 */
const LENGTH_MAP: Record<string, string> = {
  short: "100-200 words",
  medium: "200-400 words",
  long: "400-600 words"
};

/**
 * Builds the system prompt using hybrid JSON format
 */
export function buildSystemPrompt(profile?: ProfileAnalysis | null): string {
  let prompt = `CONFIG: ${JSON.stringify(POST_CONFIG)}`;

  if (profile) {
    const persona: Record<string, unknown> = {};

    if (profile.position) persona.role = profile.position;
    if (profile.company) persona.company = profile.company;
    if (profile.industry) persona.industry = profile.industry;
    if (profile.yearsExperience) persona.years = profile.yearsExperience;
    if (profile.expertise?.length) persona.expertise = profile.expertise;
    if (profile.writingStyle) persona.style = profile.writingStyle;
    if (profile.topicsOfInterest?.length) persona.topics = profile.topicsOfInterest;
    if (profile.targetAudience) persona.audience = profile.targetAudience;
    if (profile.emojiPreference) persona.emoji = profile.emojiPreference;
    if (profile.contentStrengths?.length) persona.strengths = profile.contentStrengths;
    if (profile.personalValues?.length) persona.values = profile.personalValues;

    prompt += `\nPERSONA: ${JSON.stringify(persona)}`;
    prompt += `\nWrite in THEIR voice with THEIR expertise.`;
  }

  return prompt;
}

/**
 * Builds the user prompt using structured format
 */
export function buildUserPrompt(params: GenerationParams): string {
  const request: Record<string, unknown> = {
    topic: params.topic
  };

  if (params.keyPoints?.length) request.keyPoints = params.keyPoints;
  if (params.tone) request.tone = params.tone;
  if (params.format) request.format = params.format;
  if (params.hookStyle) request.hook = params.hookStyle;
  if (params.targetAudience) request.audience = params.targetAudience;
  if (params.length) request.length = params.length;
  if (params.emojiLevel) request.emoji = params.emojiLevel;
  if (params.includeCallToAction) request.cta = true;

  let prompt = `REQUEST: ${JSON.stringify(request)}`;

  // Add tone description
  if (params.tone && TONE_MAP[params.tone]) {
    prompt += `\nTONE: ${TONE_MAP[params.tone]}`;
  }

  // Add format guidance
  if (params.format && FORMAT_MAP[params.format]) {
    prompt += `\nFORMAT: ${FORMAT_MAP[params.format]}`;
  }

  // Add hook guidance
  if (params.hookStyle && HOOK_MAP[params.hookStyle]) {
    prompt += `\nHOOK: ${HOOK_MAP[params.hookStyle]}`;
  }

  // Add length
  prompt += `\nLENGTH: ${LENGTH_MAP[params.length || 'medium']}`;

  // Add emoji
  prompt += `\nEMOJI: ${EMOJI_MAP[params.emojiLevel || 'none']}`;

  // CTA instruction
  if (params.includeCallToAction) {
    prompt += `\nEND: Question that invites discussion (required)`;
  }

  prompt += `\nOUTPUT: LinkedIn post only, no explanations.`;

  return prompt;
}

/**
 * Builds a prompt to improve existing content
 */
export function buildEnhancePrompt(existingContent: string, instructions: string): string {
  return `IMPROVE:
"${existingContent}"

INSTRUCTIONS: ${instructions}

RULES: ${JSON.stringify(POST_CONFIG.rules.never)}
BANNED: ${POST_CONFIG.rules.banned_words.join(', ')}

OUTPUT: Enhanced post only.`;
}
