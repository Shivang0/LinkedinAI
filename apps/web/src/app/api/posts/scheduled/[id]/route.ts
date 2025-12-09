import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';

// GET /api/posts/scheduled/[id] - Get a specific scheduled post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduledPost = await prisma.scheduledPost.findFirst({
    where: {
      id: params.id,
      post: { userId: session.userId },
    },
    include: {
      post: true,
    },
  });

  if (!scheduledPost) {
    return NextResponse.json(
      { error: 'Scheduled post not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ scheduledPost });
}

// PUT /api/posts/scheduled/[id] - Update scheduled post (time and/or content)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { scheduledFor, content } = body;

    // Verify the scheduled post belongs to the user
    const existingPost = await prisma.scheduledPost.findFirst({
      where: {
        id: params.id,
        post: { userId: session.userId },
        jobStatus: 'pending',
      },
      include: {
        post: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found or cannot be modified' },
        { status: 404 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Update both the scheduled post time and the post content
    const [updatedScheduledPost] = await prisma.$transaction([
      prisma.scheduledPost.update({
        where: { id: params.id },
        data: { scheduledFor: scheduledDate },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              status: true,
            },
          },
        },
      }),
      // Update the post content if provided
      ...(content !== undefined
        ? [
            prisma.post.update({
              where: { id: existingPost.postId },
              data: { content },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ scheduledPost: updatedScheduledPost });
  } catch (error) {
    console.error('Update scheduled post error:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/scheduled/[id] - Cancel a scheduled post
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify the scheduled post belongs to the user and is still pending
    const existingPost = await prisma.scheduledPost.findFirst({
      where: {
        id: params.id,
        post: { userId: session.userId },
        jobStatus: 'pending',
      },
      include: {
        post: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    // Delete the scheduled post, update the post status, and create a draft
    await prisma.$transaction([
      prisma.scheduledPost.delete({
        where: { id: params.id },
      }),
      prisma.post.update({
        where: { id: existingPost.postId },
        data: { status: 'draft' },
      }),
      // Create a draft so the content appears in the drafts page
      prisma.draft.create({
        data: {
          userId: session.userId,
          title: `Cancelled: ${new Date(existingPost.scheduledFor).toLocaleDateString()}`,
          content: existingPost.post.content,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Post moved to drafts' });
  } catch (error) {
    console.error('Cancel scheduled post error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled post' },
      { status: 500 }
    );
  }
}
