import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../redis';
import { prisma } from '@linkedin-ai/database';
import { createLinkedInPublisher } from '@linkedin-ai/services';
import {
  PUBLISH_QUEUE_NAME,
  type PublishJobData,
  type PublishJobResult,
} from '../queues/publish-queue';

/**
 * Creates and returns the publish worker
 */
export function createPublishWorker(): Worker<PublishJobData, PublishJobResult> {
  return new Worker<PublishJobData, PublishJobResult>(
    PUBLISH_QUEUE_NAME,
    async (job: Job<PublishJobData, PublishJobResult>): Promise<PublishJobResult> => {
      const { scheduledPostId, postId, userId } = job.data;

      console.log(`Processing job ${job.id} for post ${postId}`);

      // Update job status to processing
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          jobStatus: 'processing',
          lastAttemptAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      try {
        // Get post and user data
        const post = await prisma.post.findUnique({
          where: { id: postId },
          include: {
            user: true,
            mediaAssets: {
              include: { mediaAsset: true },
            },
          },
        });

        if (!post) {
          throw new Error(`Post ${postId} not found`);
        }

        if (!post.user.accessToken) {
          throw new Error('LinkedIn access token not available');
        }

        // Check user account status
        if (post.user.accountStatus !== 'active') {
          throw new Error('User account is not active');
        }

        // Check subscription status
        const subscription = await prisma.subscription.findUnique({
          where: { userId },
        });

        if (!subscription || subscription.status !== 'active') {
          throw new Error('Active subscription required to publish');
        }

        // Publish to LinkedIn
        const publisher = createLinkedInPublisher(post.user.accessToken);

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
            where: { id: postId },
            data: {
              status: 'published',
              linkedinPostId: result.postId,
              linkedinPostUrl: result.postUrl,
              publishedAt: new Date(),
            },
          }),
          prisma.scheduledPost.update({
            where: { id: scheduledPostId },
            data: { jobStatus: 'completed' },
          }),
        ]);

        console.log(`Post ${postId} published successfully`);

        return {
          success: true,
          linkedinPostId: result.postId,
          linkedinPostUrl: result.postUrl,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(`Job ${job.id} failed:`, errorMessage);

        // Update scheduled post with error
        const isFinalAttempt =
          job.attemptsMade >= (job.opts.attempts || 3) - 1;

        await prisma.scheduledPost.update({
          where: { id: scheduledPostId },
          data: {
            errorMessage,
            jobStatus: isFinalAttempt ? 'failed' : 'pending',
          },
        });

        // Update post status on final failure
        if (isFinalAttempt) {
          await prisma.post.update({
            where: { id: postId },
            data: {
              status: 'failed',
              failureReason: errorMessage,
            },
          });
        }

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5, // Process 5 jobs concurrently
      limiter: {
        max: 10,
        duration: 1000, // Max 10 jobs per second (rate limiting)
      },
    }
  );
}
