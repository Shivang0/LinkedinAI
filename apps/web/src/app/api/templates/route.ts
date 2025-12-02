import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';

// GET /api/templates - List all templates (user's + public)
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await prisma.template.findMany({
    where: {
      OR: [{ userId: session.userId }, { isPublic: true }],
    },
    orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ templates });
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, content, category } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        userId: session.userId,
        name,
        description,
        content,
        category,
        isPublic: false,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
