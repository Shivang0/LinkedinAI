import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../redis';

export const PUBLISH_QUEUE_NAME = 'post-publishing';

export interface PublishJobData {
  scheduledPostId: string;
  postId: string;
  userId: string;
  scheduledFor: string; // ISO date string
  isRecurring: boolean;
}

export interface PublishJobResult {
  success: boolean;
  linkedinPostId?: string;
  linkedinPostUrl?: string;
  error?: string;
}

let publishQueue: Queue<PublishJobData, PublishJobResult> | null = null;
let publishQueueEvents: QueueEvents | null = null;

/**
 * Gets or creates the publish queue
 */
export function getPublishQueue(): Queue<PublishJobData, PublishJobResult> {
  if (!publishQueue) {
    publishQueue = new Queue<PublishJobData, PublishJobResult>(
      PUBLISH_QUEUE_NAME,
      {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // Start with 1 minute
          },
          removeOnComplete: {
            age: 7 * 24 * 3600, // Keep completed jobs for 7 days
            count: 1000,
          },
          removeOnFail: {
            age: 30 * 24 * 3600, // Keep failed jobs for 30 days
          },
        },
      }
    );
  }

  return publishQueue;
}

/**
 * Gets or creates the queue events listener
 */
export function getPublishQueueEvents(): QueueEvents {
  if (!publishQueueEvents) {
    publishQueueEvents = new QueueEvents(PUBLISH_QUEUE_NAME, {
      connection: getRedisConnection(),
    });
  }

  return publishQueueEvents;
}

/**
 * Adds a job to the publish queue
 */
export async function addPublishJob(data: PublishJobData): Promise<string> {
  const queue = getPublishQueue();

  const scheduledTime = new Date(data.scheduledFor).getTime();
  const delay = Math.max(0, scheduledTime - Date.now());

  const job = await queue.add(`publish-${data.postId}`, data, {
    delay,
    jobId: `scheduled-${data.scheduledPostId}`,
  });

  return job.id!;
}

/**
 * Removes a job from the queue
 */
export async function removePublishJob(jobId: string): Promise<void> {
  const queue = getPublishQueue();
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}

/**
 * Gets a job by ID
 */
export async function getPublishJob(jobId: string) {
  const queue = getPublishQueue();
  return queue.getJob(jobId);
}
