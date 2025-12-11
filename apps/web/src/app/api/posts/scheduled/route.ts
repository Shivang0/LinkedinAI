import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';

// GET /api/posts/scheduled - List all scheduled posts
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduledPosts = await prisma.scheduledPost.findMany({
    where: {
      post: { userId: session.userId },
    },
    include: {
      post: {
        select: {
          id: true,
          content: true,
          status: true,
        },
      },
    },
    orderBy: { scheduledFor: 'asc' },
  });

  return NextResponse.json({ scheduledPosts });
}

// POST /api/posts/scheduled - Schedule a new post
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.accountStatus !== 'active') {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { content, scheduledFor, draftId, mediaIds } = body;

    if (!content || !scheduledFor) {
      return NextResponse.json(
        { error: 'Content and scheduled time are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Create the post and scheduled post in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the post
      const post = await tx.post.create({
        data: {
          userId: session.userId,
          content,
          status: 'scheduled',
        },
      });

      // Create the scheduled post entry
      const scheduledPost = await tx.scheduledPost.create({
        data: {
          postId: post.id,
          scheduledFor: scheduledDate,
          jobStatus: 'pending',
        },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              status: true,
            },
          },
        },
      });

      // Create PostMedia records to link media assets to the post
      if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
        await tx.postMedia.createMany({
          data: mediaIds.map((mediaAssetId: string, index: number) => ({
            postId: post.id,
            mediaAssetId,
            order: index,
          })),
        });
      }

      // If this was from a draft, delete the draft
      if (draftId) {
        await tx.draft.deleteMany({
          where: {
            id: draftId,
            userId: session.userId,
          },
        });
      }

      return scheduledPost;
    });

    return NextResponse.json({ scheduledPost: result }, { status: 201 });
  } catch (error) {
    console.error('Schedule post error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}
