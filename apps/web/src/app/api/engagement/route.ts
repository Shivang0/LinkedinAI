import { NextResponse } from 'next/server';
import { prisma } from '@linkedin-ai/database';
import { getSession } from '@/lib/auth';
import { createLinkedInClient } from '@linkedin-ai/services';
import { decrypt } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all published posts with their engagement data
    const posts = await prisma.post.findMany({
      where: {
        userId: session.userId,
        status: 'published',
        linkedinPostId: { not: null },
      },
      include: {
        engagement: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Calculate totals
    const totals = posts.reduce(
      (acc, post) => {
        if (post.engagement) {
          acc.likes += post.engagement.likes;
          acc.comments += post.engagement.comments;
          acc.shares += post.engagement.shares;
          acc.impressions += post.engagement.impressions;
          acc.clicks += post.engagement.clicks;
        }
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 }
    );

    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id,
        content: post.content,
        publishedAt: post.publishedAt,
        linkedinPostUrl: post.linkedinPostUrl,
        engagement: post.engagement
          ? {
              likes: post.engagement.likes,
              comments: post.engagement.comments,
              shares: post.engagement.shares,
              impressions: post.engagement.impressions,
              clicks: post.engagement.clicks,
              engagement: post.engagement.engagement,
              fetchedAt: post.engagement.fetchedAt,
            }
          : null,
      })),
      totals,
      postCount: posts.length,
    });
  } catch (error) {
    console.error('Engagement fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
}

// POST - Refresh engagement data for all posts
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's access token
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { accessToken: true },
    });

    if (!user?.accessToken) {
      return NextResponse.json(
        { error: 'LinkedIn access token not found' },
        { status: 400 }
      );
    }

    // Get all published posts
    const posts = await prisma.post.findMany({
      where: {
        userId: session.userId,
        status: 'published',
        linkedinPostId: { not: null },
      },
    });

    const linkedInClient = createLinkedInClient(decrypt(user.accessToken));
    const results = [];

    // Fetch and update engagement for each post
    for (const post of posts) {
      if (!post.linkedinPostId) continue;

      try {
        const metrics = await linkedInClient.getPostEngagement(post.linkedinPostId);

        // Calculate engagement rate (if impressions available)
        const engagementRate = metrics.impressions > 0
          ? ((metrics.likes + metrics.comments + metrics.shares) / metrics.impressions) * 100
          : 0;

        // Upsert engagement record
        const engagement = await prisma.postEngagement.upsert({
          where: { postId: post.id },
          create: {
            postId: post.id,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            engagement: engagementRate,
          },
          update: {
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            engagement: engagementRate,
            fetchedAt: new Date(),
          },
        });

        results.push({
          postId: post.id,
          success: true,
          engagement,
        });
      } catch (error) {
        console.error(`Failed to fetch engagement for post ${post.id}:`, error);
        results.push({
          postId: post.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Engagement data refreshed',
      results,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Engagement refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh engagement data' },
      { status: 500 }
    );
  }
}
