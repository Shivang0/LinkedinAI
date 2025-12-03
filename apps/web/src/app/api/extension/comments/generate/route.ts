import { NextResponse } from 'next/server';
import { verifyExtensionToken, extractBearerToken } from '@/lib/extension-auth';
import { prisma } from '@linkedin-ai/database';
import { z } from '@linkedin-ai/shared';
import OpenAI from 'openai';

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Validation schema for comment generation
const commentGenerationSchema = z.object({
  postContent: z.string().min(1).max(3000),
  postAuthor: z.string().min(1),
  postAuthorHeadline: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'supportive', 'curious', 'humorous', 'thought-provoking', 'inspirational']),
  style: z.enum(['agree', 'add-value', 'question', 'personal-story']),
  length: z.enum(['short', 'medium', 'long']),
  ctaType: z.enum(['none', 'question', 'soft']).optional().default('none'),
});

// Banned words for AI detection
const BANNED_WORDS = ["insightful", "resonate", "valuable", "leverage", "unpack", "highlight", "appreciate", "game-changer", "thought-provoking", "delve", "paradigm"];

/**
 * Style instructions - detailed for context
 */
const STYLE_INSTRUCTIONS: Record<string, string> = {
  agree: "Back them up with a quick example from YOUR work that relates to THEIR specific point",
  "add-value": "Add something they didn't mention - a different angle or related lesson from YOUR experience",
  question: "Ask something specific you're genuinely curious about based on what THEY wrote",
  "personal-story": "Share a quick moment from YOUR work that directly relates to THEIR post"
};

/**
 * Tone instructions - detailed for context
 */
const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Smart colleague energy - competent but not stiff",
  casual: "Coffee chat vibes - like responding to a friend's story",
  supportive: "Genuine encouragement - acknowledge their specific effort",
  curious: "Actually interested - ask what you want to know about their topic",
  humorous: "Quick wit - one light observation about their specific point",
  "thought-provoking": "Respectful pushback - add nuance to their specific argument",
  inspirational: "Real optimism - connect their idea to something bigger"
};

/**
 * Length guidance
 */
const LENGTH_GUIDE: Record<string, string> = {
  short: "1-2 punchy sentences",
  medium: "2-3 sentences with room to add value",
  long: "4-6 sentences to develop your response"
};

// POST /api/extension/comments/generate - Generate a comment
export async function POST(request: Request) {
  try {
    // Verify extension token
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const payload = await verifyExtensionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (payload.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = commentGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    const params = validationResult.data;

    // Get user's profile for personalization
    const profile = await prisma.profileAnalysis.findUnique({
      where: { userId: payload.userId },
    });

    // Build the prompt
    const systemPrompt = buildCommentSystemPrompt(profile);
    const userPrompt = buildCommentUserPrompt(params);

    // Generate comments using OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Adjust max_tokens based on length
    const maxTokens = params.length === 'long' ? 400 : params.length === 'medium' ? 300 : 200;

    // Generate main comment
    const mainResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.92,
      max_tokens: maxTokens,
    });

    const mainComment = cleanComment(mainResponse.choices[0]?.message?.content || '');

    // Generate 2 alternative comments with different styles
    const alternativeStyles = getAlternativeStyles(params.style);
    const alternatives: string[] = [];

    for (const altStyle of alternativeStyles) {
      const altPrompt = buildCommentUserPrompt({ ...params, style: altStyle });
      const altResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: altPrompt },
        ],
        temperature: 0.92,
        max_tokens: maxTokens,
      });
      alternatives.push(cleanComment(altResponse.choices[0]?.message?.content || ''));
    }

    return NextResponse.json(
      { comment: mainComment, alternatives },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Comment generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate comment' },
      { status: 500, headers: corsHeaders }
    );
  }
}

interface ProfileData {
  industry?: string | null;
  position?: string | null;
  company?: string | null;
  yearsExperience?: number | null;
  expertise?: string[];
  writingStyle?: string | null;
  emojiPreference?: string | null;
}

function buildCommentSystemPrompt(profile: ProfileData | null): string {
  let prompt = `You are writing a LinkedIn comment that adds REAL VALUE to the conversation.

YOUR GOAL: Write something the author would actually want to read - an insight, a different angle, a relevant experience, or a thoughtful question.

WHAT MAKES A GOOD COMMENT:
- Adds a new perspective or insight the author didn't mention
- Shares a brief, relevant experience (without naming your company)
- Asks a specific, thoughtful question about their point
- Offers constructive pushback or builds on their idea
- Shows you actually read and understood their post

SOUND HUMAN:
- Start naturally, sometimes mid-thought ("This reminds me of..." or "Interesting take -")
- Use contractions (I'm, you're, we've, that's)
- Have a clear opinion or reaction
- Keep it conversational, not formal
- One emoji max, only if it fits naturally

NEVER DO:
- Start with praise ("Great post!", "Love this!", "So true!")
- Mention your company name or job title explicitly
- Use buzzwords: ${BANNED_WORDS.join(', ')}
- Write generic statements that could apply to any post
- Just agree without adding anything new`;

  if (profile) {
    prompt += `\n\nYOUR BACKGROUND (use to inform your perspective, but DON'T explicitly mention):`;
    if (profile.industry) prompt += `\n- You work in: ${profile.industry}`;
    if (profile.yearsExperience) prompt += `\n- Years of experience: ${profile.yearsExperience}`;
    if (profile.expertise?.length) prompt += `\n- Your expertise areas: ${profile.expertise.join(', ')}`;

    prompt += `\n\nUse this background to give you credibility and perspective, but write as a peer sharing thoughts - NOT as someone promoting themselves or their company.`;
  }

  return prompt;
}

interface CommentParams {
  postContent: string;
  postAuthor: string;
  postAuthorHeadline?: string;
  tone: string;
  style: string;
  length: string;
  ctaType?: string;
}

function buildCommentUserPrompt(params: CommentParams): string {
  const postContent = params.postContent.slice(0, 1500);

  let prompt = `POST BY ${params.postAuthor}${params.postAuthorHeadline ? ` (${params.postAuthorHeadline})` : ''}:
"${postContent}"

---

Write a comment that:
1. ${STYLE_INSTRUCTIONS[params.style] || 'Adds genuine value'}
2. Tone: ${TONE_INSTRUCTIONS[params.tone] || 'Natural and authentic'}
3. Length: ${LENGTH_GUIDE[params.length] || '2-3 sentences'}`;

  if (params.ctaType === 'question') {
    prompt += `\n4. Ends with a thoughtful question`;
  } else if (params.ctaType === 'soft') {
    prompt += `\n4. Leaves room for continued conversation`;
  }

  prompt += `

KEY: Add something valuable - a fresh insight, relevant experience, or thoughtful angle. Don't just agree or praise.

Comment:`;

  return prompt;
}

function cleanComment(text: string): string {
  let cleaned = text
    .replace(/—/g, '-')  // Replace em-dashes
    .replace(/；/g, ',')  // Replace semicolons with commas (more casual)
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\n{2,}/g, '\n')  // Collapse multiple newlines
    .trim();

  // Remove AI-sounding opening phrases
  const aiOpenings = [
    /^(Great|Excellent|Wonderful|Amazing|Fantastic|Brilliant) (post|point|insight|take|perspective)[!.]?\s*/i,
    /^Thanks for sharing[!.]?\s*/i,
    /^I (really |truly )?(love|appreciate) (this|how you)[!.]?\s*/i,
    /^This (really )?resonates[!.]?\s*/i,
    /^What a (great|wonderful|insightful) (post|point)[!.]?\s*/i,
  ];

  for (const pattern of aiOpenings) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Ensure first letter is capitalized after cleanup
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

function getAlternativeStyles(currentStyle: string): string[] {
  const allStyles = ['agree', 'add-value', 'question', 'personal-story'];
  return allStyles.filter(s => s !== currentStyle).slice(0, 2);
}
