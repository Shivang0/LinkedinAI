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
  let prompt = `You are writing a LinkedIn comment that DIRECTLY RESPONDS to the specific post content below.

CRITICAL: Your comment MUST reference specific details, ideas, or points from the post. Generic comments are NOT acceptable.

YOUR TASK:
1. READ the post carefully
2. IDENTIFY the key point or idea the author is making
3. RESPOND specifically to that point using your experience

SOUND HUMAN:
- Start mid-thought sometimes ("Funny you mention this..." or "Ha, just dealt with this...")
- Use contractions (I'm, you're, we've, that's)
- Have an actual opinion or reaction
- Write like texting a smart colleague
- One emoji max, only if natural

NEVER DO:
- Start with "Great post!" or any praise opener
- Use words: ${BANNED_WORDS.join(', ')}
- Write generic statements that could apply to any post
- Restate what they said before adding your take`;

  if (profile) {
    prompt += `\n\nYOU ARE THIS PERSON - write as them:`;
    if (profile.position) prompt += `\n- Role: ${profile.position}`;
    if (profile.company) prompt += `\n- Company: ${profile.company}`;
    if (profile.industry) prompt += `\n- Industry: ${profile.industry}`;
    if (profile.yearsExperience) prompt += `\n- Experience: ${profile.yearsExperience} years`;
    if (profile.expertise?.length) prompt += `\n- Expertise: ${profile.expertise.join(', ')}`;
    if (profile.writingStyle) prompt += `\n- Writing style: ${profile.writingStyle}`;

    prompt += `\n\nDraw from YOUR specific work situations when responding to the post.`;
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

  let prompt = `===== THE POST YOU'RE RESPONDING TO =====
"${postContent}"

Author: ${params.postAuthor}${params.postAuthorHeadline ? ` (${params.postAuthorHeadline})` : ''}
===== END OF POST =====

YOUR COMMENT INSTRUCTIONS:
- Style: ${STYLE_INSTRUCTIONS[params.style] || 'Add genuine value based on THEIR specific point'}
- Tone: ${TONE_INSTRUCTIONS[params.tone] || 'Natural and authentic'}
- Length: ${LENGTH_GUIDE[params.length] || '2-3 sentences'}`;

  if (params.ctaType === 'question') {
    prompt += `\n- End with: A specific question about something THEY mentioned`;
  } else if (params.ctaType === 'soft') {
    prompt += `\n- End with: An open door for continued conversation about THEIR topic`;
  }

  prompt += `

REMEMBER: Your comment must DIRECTLY reference something specific from the post above.
What specific point are they making? React to THAT.

Write only the comment (no quotes, no explanations):`;

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
