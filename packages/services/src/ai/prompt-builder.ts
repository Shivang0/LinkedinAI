import type { GenerationParams, ProfileAnalysis, EmojiLevel } from '@linkedin-ai/shared';
import { BANNED_WORDS } from './content-rules';

/**
 * Hybrid JSON/Natural Language prompt configuration for post generation
 * Reduces token usage by ~60% while maintaining quality
 */
const POST_CONFIG = {
  role: "LinkedIn post writer (AS user, not FOR user)",
  goal: "Authentic, human-sounding, skimmable content",
  rules: {
    never: [
      "em-dashes (—)",
      "Numbered lists (1. 2. 3.) - use symbol bullets instead",
      "Start with: 'In today's world', 'Here's why', 'I wanted to share'",
      "Same sentence starter more than twice in a row",
      "Corporate jargon and buzzwords",
      "Long paragraphs (3+ sentences without break)"
    ],
    always: [
      "Use symbol bullets (→, •, ✓) for lists - NEVER numbered lists",
      "Blank lines between paragraphs (mobile readability)",
      "Contractions (I'm, you're, don't, can't)",
      "Varied sentence length (mix 5-word punchy + 15-word detailed)",
      "First person + direct 'you'",
      "Personal anecdotes with specifics",
      "Opinions, not just facts",
      "Short paragraphs (1-2 sentences ideal)"
    ],
    banned_words: BANNED_WORDS.slice(0, 15)
  },
  structure: "Flexible - vary format based on content type",
  format: {
    paragraphs: "1-2 sentences max, blank line between each",
    bullets: "→ or • or ✓ (NEVER numbered lists)",
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
  story: "Personal story with dramatic pacing. Short paragraphs. Line breaks for tension. Build to a revelation.",
  listicle: "Key points with → or • bullets. Each bullet 1-2 lines max. Add personal context before the list.",
  question: "Thought-provoking question explored with YOUR take. End with inviting others to share.",
  opinion: "Hot take with clear reasoning. Short punchy statements. One idea per paragraph.",
  'how-to': "Practical steps with ✓ bullets. Start each bullet with action verb. From real experience.",
  announcement: "News + why it matters + what's next. Keep excitement but stay grounded."
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

  // Add formatting instruction for listicle/how-to formats
  if (params.format === 'listicle' || params.format === 'how-to') {
    prompt += `\nFORMATTING: Use → or • or ✓ for bullets. NEVER use numbered lists (1. 2. 3.). Add blank line before and after bullet section.`;
  }

  // Add readability instructions for LinkedIn optimization
  prompt += `\nREADABILITY (critical for LinkedIn engagement):
→ Keep paragraphs to 1-2 sentences MAX
→ Add blank lines between every thought
→ Vary sentence length (mix 5-word punchy with 15-word detailed)
→ Start sentences differently (avoid I...I...I pattern)
→ Use short first line as hook (under 10 words ideal)`;

  // Add auto-format instructions
  if (params.autoFormat) {
    prompt += `\nAUTO-FORMAT (special Unicode styling for LinkedIn):
→ First line must be the hook - it will be bolded
→ Use these exact bullet symbols: → ✓ • ➤
→ Key phrases in bullets should be marked with **double asterisks**
→ One strong closing statement at the end`;
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
