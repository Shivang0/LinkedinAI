import { NextResponse } from 'next/server';
import { prisma } from '@linkedin-ai/database';
import { createLinkedInPublisher } from '@linkedin-ai/services';
import { decrypt } from '@/lib/utils';

// Vercel Cron handler - runs every 5 minutes
export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function GET(request: Request) {
  // Verify cron request with secret (via query param or header)
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-cron-secret');

  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();
  const results: { postId: string; success: boolean; error?: string }[] = [];

  try {
    // Find all scheduled posts that are due
    const duePosts = await prisma.scheduledPost.findMany({
      where: {
        scheduledFor: { lte: now },
        jobStatus: { in: ['pending', 'queued'] },
      },
      include: {
        post: {
          include: {
            user: true,
            mediaAssets: {
              include: { mediaAsset: true },
            },
          },
        },
      },
      take: 10, // Process up to 10 posts per run to avoid timeout
    });

    console.log(`Found ${duePosts.length} due posts to publish`);

    for (const scheduledPost of duePosts) {
      const { post } = scheduledPost;

      try {
        // Mark as processing
        await prisma.scheduledPost.update({
          where: { id: scheduledPost.id },
          data: {
            jobStatus: 'processing',
            lastAttemptAt: now,
            attempts: { increment: 1 },
          },
        });

        // Validate user
        if (!post.user.accessToken) {
          throw new Error('LinkedIn access token not available');
        }

        if (post.user.accountStatus !== 'active') {
          throw new Error('User account is not active');
        }

        // Decrypt and use the access token
        const accessToken = decrypt(post.user.accessToken);

        // Publish to LinkedIn
        const publisher = createLinkedInPublisher(accessToken);

        const mediaUrls = post.mediaAssets
          .map((m) => m.mediaAsset.publicUrl)
          .filter(Boolean) as string[];

        const result = await publisher.publish({
          content: post.content,
          authorId: post.user.linkedinId,
          mediaUrls,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to publish to LinkedIn');
        }

        // Update post and scheduled post on success
        await prisma.$transaction([
          prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'published',
              linkedinPostId: result.postId,
              linkedinPostUrl: result.postUrl,
              publishedAt: new Date(),
            },
          }),
          prisma.scheduledPost.update({
            where: { id: scheduledPost.id },
            data: { jobStatus: 'completed' },
          }),
        ]);

        console.log(`Post ${post.id} published successfully`);
        results.push({ postId: post.id, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to publish post ${post.id}:`, errorMessage);

        // Check if we should mark as failed (after 3 attempts)
        const isFinalAttempt = (scheduledPost.attempts || 0) >= 2;

        await prisma.scheduledPost.update({
          where: { id: scheduledPost.id },
          data: {
            errorMessage,
            jobStatus: isFinalAttempt ? 'failed' : 'pending',
          },
        });

        if (isFinalAttempt) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'failed',
              failureReason: errorMessage,
            },
          });
        }

        results.push({ postId: post.id, success: false, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron publish error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    );
  }
}
