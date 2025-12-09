import { NextResponse } from 'next/server';
import { verifyExtensionToken, extractBearerToken } from '@/lib/extension-auth';
import { z } from '@linkedin-ai/shared';
import OpenAI from 'openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const commentGenerationSchema = z.object({
  postContent: z.string().min(1).max(3000),
  postAuthor: z.string().min(1),
  postAuthorHeadline: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'supportive', 'curious', 'humorous', 'thought-provoking', 'inspirational']),
  style: z.enum(['agree', 'add-value', 'question', 'personal-story']),
  length: z.enum(['short', 'medium', 'long']),
  ctaType: z.enum(['none', 'question', 'soft']).optional().default('none'),
});

// Word-based length (more precise than sentences)
const LENGTHS: Record<string, string> = {
  short: '15-30w',
  medium: '50-75w',
  long: '100-150w'
};

// Compact tone mapping
const TONES: Record<string, string> = {
  professional: 'pro',
  casual: 'casual',
  supportive: 'supportive',
  curious: 'curious',
  humorous: 'witty',
  'thought-provoking': 'thoughtful',
  inspirational: 'inspiring'
};

// Style actions
const STYLES: Record<string, string> = {
  agree: 'agree + add substance',
  'add-value': 'add new angle',
  question: 'ask thoughtful question',
  'personal-story': 'share brief insight'
};

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const payload = await verifyExtensionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }

    if (payload.accountStatus !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();
    const result = commentGenerationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders });
    }

    const params = result.data;

    // Debug logging
    console.log('[Comment API] Received postContent length:', params.postContent?.length);
    console.log('[Comment API] Content preview:', params.postContent?.slice(0, 200));
    console.log('[Comment API] Author:', params.postAuthor);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const maxTokens = params.length === 'long' ? 200 : params.length === 'medium' ? 150 : 100;

    // Generate main comment
    const mainResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: buildUserPrompt(params) },
      ],
      temperature: 0.7,  // Lowered from 0.9 for more focused responses
      max_tokens: maxTokens,
    });

    const mainComment = cleanComment(mainResponse.choices[0]?.message?.content || '');

    // Generate 2 alternatives with different styles
    const altStyles = getAlternativeStyles(params.style);
    const alternatives: string[] = [];

    for (const style of altStyles) {
      const altResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: buildUserPrompt({ ...params, style }) },
        ],
        temperature: 0.7,  // Lowered from 0.9 for more focused responses
        max_tokens: maxTokens,
      });
      alternatives.push(cleanComment(altResponse.choices[0]?.message?.content || ''));
    }

    return NextResponse.json({ comment: mainComment, alternatives }, { headers: corsHeaders });
  } catch (error) {
    console.error('Comment generation error:', error);
    return NextResponse.json({ error: 'Failed to generate comment' }, { status: 500, headers: corsHeaders });
  }
}

function getSystemPrompt(): string {
  return `You write LinkedIn comments that DIRECTLY respond to specific content in posts.

CRITICAL RULES:
1. You MUST quote or paraphrase something specific from the post
2. NEVER write generic comments like "Great insights!" or "Thanks for sharing!"
3. Your comment should only make sense for THIS specific post
4. Use natural language with contractions (I'm, you're, don't)
5. NO em-dashes (—), colons (:), or semicolons (;)
6. NO AI buzzwords: delve, insightful, resonate, leverage, valuable, journey, impactful`;
}

function buildUserPrompt(params: {
  postContent: string;
  postAuthor: string;
  postAuthorHeadline?: string;
  tone: string;
  style: string;
  length: string;
  ctaType?: string;
}): string {
  const len = LENGTHS[params.length] || '50-75w';
  const tone = TONES[params.tone] || 'pro';
  const style = STYLES[params.style] || 'add value';

  return `TASK: Write a ${len} ${tone} comment for this LinkedIn post.

THE POST:
"""
${params.postContent.slice(0, 1500)}
"""
Author: ${params.postAuthor}

REQUIREMENTS:
1. Your FIRST sentence MUST reference a specific point, fact, or idea from the post above
2. Style: ${style}
3. Your comment should NOT make sense if applied to any other post - it must be specific to THIS content
4. Use contractions naturally${params.ctaType === 'question' ? '\n5. End with a question related to what the author said' : ''}

Write the comment:`;
}

function cleanComment(text: string): string {
  let cleaned = text
    .replace(/—/g, '-')
    .replace(/:/g, ',')
    .replace(/;/g, ',')
    .replace(/^["']|["']$/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  // Remove AI-sounding openers
  const patterns = [
    /^(Great|Excellent|Wonderful|Amazing|Fantastic) (post|point|insight)[!.]?\s*/i,
    /^Thanks for sharing[!.]?\s*/i,
    /^I (really |truly )?(love|appreciate) this[!.]?\s*/i,
    /^This (really )?resonates[!.]?\s*/i,
  ];

  for (const p of patterns) {
    cleaned = cleaned.replace(p, '');
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

function getAlternativeStyles(currentStyle: string): string[] {
  const all = ['agree', 'add-value', 'question', 'personal-story'];
  return all.filter(s => s !== currentStyle).slice(0, 2);
}
