import { NextResponse } from 'next/server';
import { prisma } from '@linkedin-ai/database';
import { getSession } from '@/lib/auth';
import { createLinkedInClient } from '@linkedin-ai/services';

interface RouteParams {
  params: Promise<{ postId: string }>;
}

// GET - Get engagement for a specific post
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    // Get post with engagement
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { engagement: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      postId: post.id,
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
    });
  } catch (error) {
    console.error('Engagement fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
}

// POST - Force refresh engagement for a specific post
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!post.linkedinPostId) {
      return NextResponse.json(
        { error: 'Post does not have a LinkedIn ID' },
        { status: 400 }
      );
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

    // Fetch engagement from LinkedIn
    const linkedInClient = createLinkedInClient(user.accessToken);
    const metrics = await linkedInClient.getPostEngagement(post.linkedinPostId);

    // Calculate engagement rate
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

    return NextResponse.json({
      message: 'Engagement data refreshed',
      engagement: {
        likes: engagement.likes,
        comments: engagement.comments,
        shares: engagement.shares,
        impressions: engagement.impressions,
        clicks: engagement.clicks,
        engagement: engagement.engagement,
        fetchedAt: engagement.fetchedAt,
      },
    });
  } catch (error) {
    console.error('Engagement refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh engagement data' },
      { status: 500 }
    );
  }
}
