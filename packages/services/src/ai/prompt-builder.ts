import type { GenerationParams, ProfileAnalysis, EmojiLevel } from '@linkedin-ai/shared';
import { BANNED_WORDS } from './content-rules';

/**
 * Emoji level instructions for AI generation
 */
const EMOJI_INSTRUCTIONS: Record<EmojiLevel, string> = {
  none: 'Do NOT include any emojis in the post.',
  light: 'Include 1-2 relevant emojis sparingly (e.g., at section breaks or key points).',
  moderate: 'Include 3-5 emojis throughout the post to add visual interest.',
  heavy: 'Include 6+ emojis liberally throughout the post for high engagement and visual appeal.',
};

/**
 * Builds the profile context section for the system prompt
 */
function buildProfileContext(profile: ProfileAnalysis): string {
  const lines: string[] = ['\nUSER CONTEXT (write in their voice):'];

  // Professional context
  if (profile.position || profile.company) {
    let role = `- Role: ${profile.position || 'Professional'}`;
    if (profile.company) role += ` at ${profile.company}`;
    lines.push(role);
  }

  if (profile.yearsExperience) {
    lines.push(`- Experience: ${profile.yearsExperience} years in the field`);
  }

  if (profile.industry) {
    lines.push(`- Industry: ${profile.industry}`);
  }

  // Expertise & Style
  if (profile.expertise?.length > 0) {
    lines.push(`- Expertise: ${profile.expertise.join(', ')}`);
  }

  if (profile.writingStyle) {
    lines.push(`- Writing style: ${profile.writingStyle}`);
  }

  if (profile.topicsOfInterest?.length > 0) {
    lines.push(`- Topics of interest: ${profile.topicsOfInterest.join(', ')}`);
  }

  // Content preferences
  if (profile.contentStrengths?.length > 0) {
    lines.push(`- Content strengths: ${profile.contentStrengths.join(', ')}`);
  }

  if (profile.personalValues?.length > 0) {
    lines.push(`- Values to reflect: ${profile.personalValues.join(', ')}`);
  }

  // Audience
  if (profile.targetAudience) {
    lines.push(`- Target audience: ${profile.targetAudience}`);
  }

  // Default preferences
  if (profile.emojiPreference) {
    lines.push(`- Default emoji style: ${profile.emojiPreference}`);
  }

  if (profile.hashtagUsage) {
    lines.push(`- Hashtag preference: ${profile.hashtagUsage}`);
  }

  return lines.join('\n');
}

/**
 * Builds the system prompt for AI content generation
 * Incorporates natural writing rules from natural-content-generation-guide.md
 */
export function buildSystemPrompt(profile?: ProfileAnalysis | null): string {
  const bannedWordsShort = BANNED_WORDS.slice(0, 20).join(', ');

  return `You are writing LinkedIn posts AS the user, not for them.
Write like a real professional sharing genuine insights.
Your goal is to create authentic, engaging content that sounds human-written.

CRITICAL RULES - YOU MUST FOLLOW THESE:

1. NEVER use these words (they trigger AI detection):
   ${bannedWordsShort}

2. NEVER use em-dashes (—). Use commas, periods, or regular hyphens instead.

3. NEVER start posts with:
   - "In today's world..."
   - "Here's why..." or "Here's how..."
   - "I wanted to share..."
   - Generic numbered lists without context

4. Writing style requirements:
   - Write conversationally, like you're talking to a colleague
   - Use contractions naturally (I'm, you're, it's, don't, can't)
   - Vary sentence length - mix short punchy sentences with longer ones
   - Start some sentences with "And" or "But" (natural speech pattern)
   - Use first person ("I") and speak directly to reader ("you")
   - Include occasional imperfections that humans make
   - Avoid corporate jargon and buzzwords

5. Formatting for LinkedIn:
   - Use line breaks liberally (LinkedIn rewards whitespace)
   - Keep paragraphs to 1-3 sentences max
   - Start with a hook that stops the scroll
   - End with engagement prompt or call-to-action
   - Limit hashtags to 3-5, placed at the end
   - Use emojis sparingly (0-3 max) if at all

6. Content structure:
   - Hook (first 1-2 lines visible before "see more")
   - Body (the main content, easy to skim)
   - Takeaway or insight
   - Call-to-action or question

7. What makes content feel human:
   - Personal anecdotes and specific details
   - Opinions and perspectives (not just facts)
   - Vulnerability and admitting mistakes
   - Specific numbers ("3 years ago" not "some time ago")
   - Questions to the reader
   - Incomplete thoughts or parenthetical asides

${profile ? buildProfileContext(profile) : ''}

Remember: The goal is authentic engagement, not virality. Write like a real person sharing genuine insights.`;
}

/**
 * Builds the user prompt based on generation parameters
 */
export function buildUserPrompt(params: GenerationParams): string {
  const parts: string[] = [];

  parts.push('Generate a LinkedIn post with these specifications:');

  if (params.topic) {
    parts.push(`\nTOPIC: ${params.topic}`);
  }

  if (params.keyPoints?.length) {
    parts.push(`\nKEY POINTS TO INCLUDE:\n${params.keyPoints.map(p => `- ${p}`).join('\n')}`);
  }

  if (params.tone) {
    const toneDescriptions: Record<string, string> = {
      professional: 'Clear and direct, expert but approachable, share insights not platitudes',
      casual: 'Friendly and relatable, conversational language, personal stories prominent',
      inspirational: 'Authentic vulnerability, real struggles and lessons, specific examples, avoid cliches',
      educational: 'Teaching something valuable, step-by-step when helpful, practical takeaways',
      storytelling: 'Narrative-driven, build tension and resolution, emotional connection',
    };
    parts.push(`\nTONE: ${params.tone} - ${toneDescriptions[params.tone] || ''}`);
  }

  if (params.format) {
    const formatGuidance: Record<string, string> = {
      story: 'Tell a personal story with a clear lesson or insight',
      listicle: 'Share key points but add personal context, not a generic list',
      question: 'Start with a thought-provoking question, explore it',
      opinion: 'Share a clear opinion or hot take with reasoning',
      'how-to': 'Practical guide based on your experience',
      announcement: 'Share news with personal perspective on why it matters',
    };
    parts.push(`\nFORMAT: ${params.format} - ${formatGuidance[params.format] || ''}`);
  }

  if (params.hookStyle) {
    const hookGuidance: Record<string, string> = {
      question: 'Start with a provocative or relatable question',
      statistic: 'Open with a specific, surprising number or stat',
      'bold-statement': 'Lead with a strong opinion or contrarian view',
      'personal-story': 'Begin with "I" and a specific moment or experience',
      contrarian: 'Challenge a common assumption or popular belief',
    };
    parts.push(`\nHOOK STYLE: ${hookGuidance[params.hookStyle] || params.hookStyle}`);
  }

  if (params.targetAudience) {
    parts.push(`\nTARGET AUDIENCE: ${params.targetAudience}`);
  }

  // Length guidance
  const lengthGuidance: Record<string, string> = {
    short: '100-200 words - punchy and impactful',
    medium: '200-400 words - room for story and insight',
    long: '400-600 words - detailed narrative or comprehensive guide',
  };
  parts.push(`\nLENGTH: ${lengthGuidance[params.length || 'medium']}`);

  if (params.includeCallToAction) {
    parts.push('\nEND with an engaging question that invites readers to share their thoughts, experiences, or opinions. The question should be open-ended and directly related to the topic. This is NOT optional - the post MUST end with a question.');
  }

  // Add emoji level instruction
  if (params.emojiLevel) {
    parts.push(`\nEMOJI USAGE: ${EMOJI_INSTRUCTIONS[params.emojiLevel]}`);
  } else {
    parts.push(`\nEMOJI USAGE: ${EMOJI_INSTRUCTIONS.none}`);
  }

  parts.push(`\n
IMPORTANT REMINDERS:
- NO em-dashes (—)
- NO "delve", "leverage", "game-changer", "transform", etc.
- Start STRONG - the first line must hook
- Use LINE BREAKS between thoughts
- Sound HUMAN - conversational, specific, opinionated
- End with engagement - question or clear CTA`);

  return parts.join('');
}

/**
 * Builds a prompt to improve existing content
 */
export function buildEnhancePrompt(existingContent: string, instructions: string): string {
  return `Improve this LinkedIn post based on the following instructions.

CURRENT POST:
${existingContent}

IMPROVEMENT INSTRUCTIONS:
${instructions}

Maintain the core message but enhance based on instructions.

RULES:
- NO em-dashes (—)
- NO buzzwords (delve, leverage, game-changer, transform)
- Keep it conversational and human
- Use line breaks for readability
- Vary sentence length`;
}
