import { prisma } from '@linkedin-ai/database';
import { addPublishJob, removePublishJob, type PublishJobData } from './queues/publish-queue';

/**
 * Schedules a post for publishing
 */
export async function schedulePost(options: {
  scheduledPostId: string;
  postId: string;
  userId: string;
  scheduledFor: Date;
  isRecurring?: boolean;
}): Promise<string> {
  const { scheduledPostId, postId, userId, scheduledFor, isRecurring = false } = options;

  const delay = scheduledFor.getTime() - Date.now();

  if (delay < 0) {
    throw new Error('Cannot schedule post in the past');
  }

  const jobData: PublishJobData = {
    scheduledPostId,
    postId,
    userId,
    scheduledFor: scheduledFor.toISOString(),
    isRecurring,
  };

  const jobId = await addPublishJob(jobData);

  // Update scheduled post with job ID
  await prisma.scheduledPost.update({
    where: { id: scheduledPostId },
    data: {
      jobId,
      jobStatus: 'queued',
    },
  });

  return jobId;
}

/**
 * Cancels a scheduled post
 */
export async function cancelScheduledPost(scheduledPostId: string): Promise<void> {
  const scheduledPost = await prisma.scheduledPost.findUnique({
    where: { id: scheduledPostId },
  });

  if (scheduledPost?.jobId) {
    await removePublishJob(scheduledPost.jobId);
  }

  await prisma.scheduledPost.update({
    where: { id: scheduledPostId },
    data: { jobStatus: 'canceled' },
  });
}

/**
 * Reschedules a post to a new time
 */
export async function reschedulePost(
  scheduledPostId: string,
  newScheduledFor: Date
): Promise<string> {
  const scheduledPost = await prisma.scheduledPost.findUnique({
    where: { id: scheduledPostId },
    include: { post: true },
  });

  if (!scheduledPost) {
    throw new Error('Scheduled post not found');
  }

  // Cancel existing job
  await cancelScheduledPost(scheduledPostId);

  // Update scheduled for time
  await prisma.scheduledPost.update({
    where: { id: scheduledPostId },
    data: {
      scheduledFor: newScheduledFor,
      jobStatus: 'pending',
    },
  });

  // Schedule new job
  return schedulePost({
    scheduledPostId,
    postId: scheduledPost.postId,
    userId: scheduledPost.post.userId,
    scheduledFor: newScheduledFor,
    isRecurring: scheduledPost.isRecurring,
  });
}

/**
 * Creates a scheduled post and schedules it
 */
export async function createAndSchedulePost(options: {
  postId: string;
  userId: string;
  scheduledFor: Date;
  timezone?: string;
  isRecurring?: boolean;
}): Promise<{ scheduledPost: { id: string }; jobId: string }> {
  const { postId, userId, scheduledFor, timezone = 'UTC', isRecurring = false } = options;

  // Create scheduled post record
  const scheduledPost = await prisma.scheduledPost.create({
    data: {
      postId,
      scheduledFor,
      timezone,
      isRecurring,
      jobStatus: 'pending',
    },
  });

  // Update post status
  await prisma.post.update({
    where: { id: postId },
    data: { status: 'scheduled', scheduledAt: scheduledFor },
  });

  // Schedule the job
  const jobId = await schedulePost({
    scheduledPostId: scheduledPost.id,
    postId,
    userId,
    scheduledFor,
    isRecurring,
  });

  return { scheduledPost, jobId };
}

/**
 * Gets all scheduled posts for a user
 */
export async function getUserScheduledPosts(userId: string) {
  return prisma.scheduledPost.findMany({
    where: {
      post: { userId },
      jobStatus: { in: ['pending', 'queued'] },
    },
    include: {
      post: true,
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

/**
 * Processes recurring schedules - called periodically
 */
export async function processRecurringSchedules(): Promise<void> {
  const now = new Date();
  const lookAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

  const recurringPosts = await prisma.scheduledPost.findMany({
    where: {
      isRecurring: true,
      jobStatus: { in: ['completed', 'pending'] },
      recurringRule: {
        nextOccurrenceAt: { lte: lookAhead },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    },
    include: {
      post: true,
      recurringRule: true,
    },
  });

  for (const scheduled of recurringPosts) {
    if (!scheduled.recurringRule) continue;

    const nextOccurrence = scheduled.recurringRule.nextOccurrenceAt;
    if (!nextOccurrence || nextOccurrence <= now) continue;

    // Clone the post for this occurrence
    const newPost = await prisma.post.create({
      data: {
        userId: scheduled.post.userId,
        content: scheduled.post.content,
        status: 'scheduled',
        templateId: scheduled.post.templateId,
        generationPrompt: scheduled.post.generationPrompt,
        aiGenerated: scheduled.post.aiGenerated,
      },
    });

    // Create and schedule new post
    await createAndSchedulePost({
      postId: newPost.id,
      userId: scheduled.post.userId,
      scheduledFor: nextOccurrence,
      timezone: scheduled.timezone,
      isRecurring: false, // Individual occurrence is not recurring
    });

    // Calculate and update next occurrence
    const nextNext = calculateNextOccurrence(scheduled.recurringRule);
    await prisma.recurringRule.update({
      where: { id: scheduled.recurringRule.id },
      data: {
        lastGeneratedAt: now,
        nextOccurrenceAt: nextNext,
      },
    });
  }
}

/**
 * Calculates the next occurrence based on recurring rule
 */
function calculateNextOccurrence(rule: {
  frequency: string;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  timeOfDay: string;
  endDate: Date | null;
  nextOccurrenceAt: Date | null;
}): Date | null {
  const current = rule.nextOccurrenceAt || new Date();
  const [hours, minutes] = rule.timeOfDay.split(':').map(Number);

  let next = new Date(current);

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 7 * rule.interval);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + rule.interval);
      if (rule.dayOfMonth) {
        next.setDate(rule.dayOfMonth);
      }
      break;

    default:
      return null;
  }

  next.setHours(hours, minutes, 0, 0);

  // Check if past end date
  if (rule.endDate && next > rule.endDate) {
    return null;
  }

  return next;
}
