import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';
import { createDraftSchema } from '@linkedin-ai/shared';

// GET /api/drafts - List all drafts
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const drafts = await prisma.draft.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ drafts });
}

// POST /api/drafts - Create a new draft
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = createDraftSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, content } = validationResult.data;

    const draft = await prisma.draft.create({
      data: {
        userId: session.userId,
        title,
        content,
      },
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error('Create draft error:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
