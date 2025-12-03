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

// Minimal system prompt
const SYSTEM_PROMPT = `Read the post. Write a useful comment.

Good comments:
- Add a fresh perspective or angle
- Ask a thoughtful question
- Share a relevant insight
- Offer constructive feedback

Bad comments:
- Generic praise ("Great post!", "Love this!")
- Restating what they said
- Buzzwords (insightful, resonate, valuable, leverage)

Keep it natural and conversational. No emojis unless truly fitting.`;

// Style hints
const STYLES: Record<string, string> = {
  agree: "agree and add substance",
  "add-value": "add a new angle they missed",
  question: "ask a thoughtful question",
  "personal-story": "share a brief relevant insight"
};

// Tone hints
const TONES: Record<string, string> = {
  professional: "professional",
  casual: "casual",
  supportive: "supportive",
  curious: "curious",
  humorous: "witty",
  "thought-provoking": "thought-provoking",
  inspirational: "inspiring"
};

// Length guide
const LENGTHS: Record<string, string> = {
  short: "1-2 sentences",
  medium: "2-3 sentences",
  long: "4-5 sentences"
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
    const userPrompt = buildUserPrompt(params);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const maxTokens = params.length === 'long' ? 300 : params.length === 'medium' ? 200 : 150;

    // Generate main comment
    const mainResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: maxTokens,
    });

    const mainComment = cleanComment(mainResponse.choices[0]?.message?.content || '');

    // Generate 2 alternatives with different styles
    const altStyles = getAlternativeStyles(params.style);
    const alternatives: string[] = [];

    for (const style of altStyles) {
      const altPrompt = buildUserPrompt({ ...params, style });
      const altResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: altPrompt },
        ],
        temperature: 0.9,
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

function buildUserPrompt(params: {
  postContent: string;
  postAuthor: string;
  postAuthorHeadline?: string;
  tone: string;
  style: string;
  length: string;
  ctaType?: string;
}): string {
  return `Post by ${params.postAuthor}:
"${params.postContent.slice(0, 1500)}"

Write a ${TONES[params.tone] || 'natural'} comment that ${STYLES[params.style] || 'adds value'}. Keep it ${LENGTHS[params.length] || '2-3 sentences'}.${params.ctaType === 'question' ? ' End with a question.' : ''}

Comment:`;
}

function cleanComment(text: string): string {
  let cleaned = text
    .replace(/—/g, '-')
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
