import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';
import { createLinkedInPublisher } from '@linkedin-ai/services';
import { decrypt } from '@/lib/utils';

/**
 * POST /api/posts/publish
 * Immediately publishes a post to LinkedIn
 */
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
    const { content, draftId, mediaIds } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get user with access token
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user?.accessToken) {
      return NextResponse.json(
        { error: 'LinkedIn access token not available' },
        { status: 400 }
      );
    }

    // Create the post record
    const post = await prisma.post.create({
      data: {
        userId: session.userId,
        content,
        status: 'publishing',
      },
    });

    // Create PostMedia records if media provided
    if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
      await prisma.postMedia.createMany({
        data: mediaIds.map((mediaAssetId: string, index: number) => ({
          postId: post.id,
          mediaAssetId,
          order: index,
        })),
      });
    }

    // Get media URLs if any
    const mediaUrls: string[] = [];
    if (mediaIds && mediaIds.length > 0) {
      const mediaAssets = await prisma.mediaAsset.findMany({
        where: { id: { in: mediaIds } },
      });
      mediaUrls.push(
        ...(mediaAssets.map((m) => m.publicUrl).filter(Boolean) as string[])
      );
    }

    // Publish to LinkedIn
    const accessToken = decrypt(user.accessToken);
    const publisher = createLinkedInPublisher(accessToken);

    const result = await publisher.publish({
      content,
      authorId: user.linkedinId,
      mediaUrls,
    });

    if (!result.success) {
      // Update post status to failed
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'failed',
          failureReason: result.error,
        },
      });

      return NextResponse.json(
        { error: result.error || 'Failed to publish to LinkedIn' },
        { status: 500 }
      );
    }

    // Update post with success data
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'published',
        linkedinPostId: result.postId,
        linkedinPostUrl: result.postUrl,
        publishedAt: new Date(),
      },
    });

    // Delete draft if this was from a draft
    if (draftId) {
      await prisma.draft.deleteMany({
        where: {
          id: draftId,
          userId: session.userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        linkedinPostId: result.postId,
        linkedinPostUrl: result.postUrl,
      },
    });
  } catch (error) {
    console.error('Publish post error:', error);
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    );
  }
}
