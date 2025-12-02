import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';
import { createContentGenerator } from '@linkedin-ai/services';
import { generationParamsSchema, ProfileAnalysis } from '@linkedin-ai/shared';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check account status
  if (session.accountStatus !== 'active') {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = generationParamsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Get user's profile analysis for personalization
    const profileAnalysis = await prisma.profileAnalysis.findUnique({
      where: { userId: session.userId },
    });

    // Create content generator
    const generator = createContentGenerator();

    // Generate content
    const result = await generator.generate(params, profileAnalysis as ProfileAnalysis | null);

    return NextResponse.json({
      content: result.content,
      validation: result.validation,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
