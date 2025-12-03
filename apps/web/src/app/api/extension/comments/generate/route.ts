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
  tone: z.enum(['professional', 'casual', 'supportive', 'curious']),
  style: z.enum(['agree', 'add-value', 'question', 'personal-story']),
  length: z.enum(['short', 'medium']),
});

// Banned phrases for comments
const BANNED_COMMENT_PHRASES = [
  'great post',
  'thanks for sharing',
  'love this',
  'so true',
  'couldn\'t agree more',
  'this is spot on',
  'well said',
  'totally agree',
  'absolutely',
  'game-changer',
  'thought-provoking',
];

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

    // Generate main comment
    const mainResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 200,
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
        temperature: 0.85,
        max_tokens: 200,
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
  const bannedWords = BANNED_COMMENT_PHRASES.join(', ');

  let prompt = `You are writing LinkedIn comments as the user. Your comments must be authentic, valuable, and encourage further discussion.

CRITICAL RULES FOR COMMENTS:

1. NEVER use these generic phrases: ${bannedWords}

2. NEVER be sycophantic. Add genuine value, not flattery.

3. Comment requirements:
   - Write as if talking directly to the post author
   - Add a new perspective, question, or insight
   - Keep it concise (1-4 sentences max)
   - Use contractions naturally (I'm, you're, it's)
   - NO em-dashes (—)
   - Sound human, not polished

4. What makes a great comment:
   - Adds something the post didn't cover
   - Shares a brief relevant experience
   - Asks a thoughtful follow-up question
   - Respectfully offers an alternative view
   - Connects the topic to a related idea`;

  // Add profile context if available
  if (profile) {
    prompt += '\n\nUSER CONTEXT (write in their voice):';
    if (profile.position || profile.company) {
      prompt += `\n- Role: ${profile.position || 'Professional'}`;
      if (profile.company) prompt += ` at ${profile.company}`;
    }
    if (profile.yearsExperience) {
      prompt += `\n- Experience: ${profile.yearsExperience} years in the field`;
    }
    if (profile.industry) {
      prompt += `\n- Industry: ${profile.industry}`;
    }
    if (profile.expertise && profile.expertise.length > 0) {
      prompt += `\n- Expertise: ${profile.expertise.join(', ')}`;
    }
    if (profile.writingStyle) {
      prompt += `\n- Writing style: ${profile.writingStyle}`;
    }
    if (profile.emojiPreference && profile.emojiPreference !== 'none') {
      prompt += `\n- May include 1-2 relevant emojis`;
    }
  }

  prompt += '\n\nRemember: Quality engagement builds professional reputation. Add value, not noise.';

  return prompt;
}

interface CommentParams {
  postContent: string;
  postAuthor: string;
  postAuthorHeadline?: string;
  tone: string;
  style: string;
  length: string;
}

function buildCommentUserPrompt(params: CommentParams): string {
  const styleInstructions: Record<string, string> = {
    'agree': 'Share why you agree and add a supporting example, data point, or insight from your experience',
    'add-value': 'Add a new perspective, related idea, or insight the post did not cover',
    'question': 'Ask a thoughtful follow-up question that deepens the discussion',
    'personal-story': 'Share a brief (1-2 sentence) relevant personal experience',
  };

  const toneInstructions: Record<string, string> = {
    'professional': 'Business-appropriate, clear, and substantive',
    'casual': 'Friendly and conversational, like talking to a colleague',
    'supportive': 'Encouraging and constructive, acknowledging the effort',
    'curious': 'Genuinely interested, asking to learn more',
  };

  const lengthGuide = params.length === 'short'
    ? '1-2 sentences (30-60 words)'
    : '2-4 sentences (60-120 words)';

  return `Generate a LinkedIn comment for this post:

POST AUTHOR: ${params.postAuthor}${params.postAuthorHeadline ? `\nAUTHOR HEADLINE: ${params.postAuthorHeadline}` : ''}

POST CONTENT:
${params.postContent.slice(0, 1500)}

COMMENT REQUIREMENTS:
- Style: ${params.style} - ${styleInstructions[params.style] || 'Add genuine value'}
- Tone: ${params.tone} - ${toneInstructions[params.tone] || 'Professional and engaging'}
- Length: ${lengthGuide}

RULES:
- NO em-dashes (—)
- NO generic praise ("Great post!", "Love this!")
- NO buzzwords (leverage, synergy, game-changer)
- Add genuine value or insight
- Sound authentically human

Write the comment now:`;
}

function cleanComment(text: string): string {
  return text
    .replace(/—/g, '-')  // Replace em-dashes
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\n{2,}/g, '\n')  // Collapse multiple newlines
    .trim();
}

function getAlternativeStyles(currentStyle: string): string[] {
  const allStyles = ['agree', 'add-value', 'question', 'personal-story'];
  return allStyles.filter(s => s !== currentStyle).slice(0, 2);
}
