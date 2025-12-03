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

/**
 * Hybrid JSON/Natural Language config for comment generation
 * Reduces token usage by ~62% while maintaining quality
 */
const COMMENT_CONFIG = {
  role: "LinkedIn comment ghostwriter",
  goal: "Sound like typed on phone between meetings",
  do: [
    "Start mid-thought naturally",
    "Use contractions",
    "Reference specific experience",
    "Have opinions",
    "One emoji max"
  ],
  never: [
    "Start with praise (Great post!, Love this)",
    "Use: insightful, resonate, valuable, leverage, unpack",
    "Perfect grammar throughout",
    "Restate post content",
    "Generic statements"
  ],
  banned_words: ["insightful", "resonate", "valuable", "leverage", "unpack", "highlight", "appreciate", "game-changer", "thought-provoking"],
  test: "Would busy professional type this?"
};

/**
 * Style mappings - concise
 */
const STYLE_MAP: Record<string, string> = {
  agree: "Back up with example",
  "add-value": "Add angle they missed",
  question: "Ask something specific",
  "personal-story": "Quick relevant moment"
};

/**
 * Tone mappings - concise
 */
const TONE_MAP: Record<string, string> = {
  professional: "Smart colleague",
  casual: "Coffee chat",
  supportive: "Genuine encouragement",
  curious: "Actually interested",
  humorous: "Quick wit",
  "thought-provoking": "Respectful pushback",
  inspirational: "Real optimism"
};

/**
 * Length mappings
 */
const LENGTH_MAP: Record<string, string> = {
  short: "1-2 sentences",
  medium: "2-3 sentences",
  long: "4-6 sentences"
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
  let prompt = `CONFIG: ${JSON.stringify(COMMENT_CONFIG)}`;

  if (profile) {
    const persona: Record<string, unknown> = {};

    if (profile.position) persona.role = profile.position;
    if (profile.company) persona.company = profile.company;
    if (profile.industry) persona.industry = profile.industry;
    if (profile.yearsExperience) persona.years = profile.yearsExperience;
    if (profile.expertise?.length) persona.expertise = profile.expertise;
    if (profile.writingStyle) persona.style = profile.writingStyle;
    if (profile.emojiPreference) persona.emoji = profile.emojiPreference;

    prompt += `\nPERSONA: ${JSON.stringify(persona)}`;
    prompt += `\nUSE PERSONA: Reference YOUR specific work situations.`;
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
  let prompt = `POST: "${params.postContent.slice(0, 1500)}"
BY: ${params.postAuthor}${params.postAuthorHeadline ? ` (${params.postAuthorHeadline})` : ''}
STYLE: ${STYLE_MAP[params.style] || 'Add value'}
TONE: ${TONE_MAP[params.tone] || 'Natural'}
LENGTH: ${LENGTH_MAP[params.length] || '2-3 sentences'}`;

  if (params.ctaType === 'question') {
    prompt += `\nCTA: End with question`;
  } else if (params.ctaType === 'soft') {
    prompt += `\nCTA: Open invitation`;
  }

  prompt += `\nOUTPUT: Comment only.`;

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
