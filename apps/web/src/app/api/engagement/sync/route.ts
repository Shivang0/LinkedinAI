import { NextResponse } from 'next/server';
import { prisma } from '@linkedin-ai/database';
import { getSession } from '@/lib/auth';
import { createLinkedInClient } from '@linkedin-ai/services';
import { decrypt } from '@/lib/utils';

// POST - Sync/import all posts from LinkedIn profile
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's access token
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { accessToken: true, linkedinId: true },
    });

    if (!user?.accessToken) {
      return NextResponse.json(
        { error: 'LinkedIn access token not found' },
        { status: 400 }
      );
    }

    const linkedInClient = createLinkedInClient(decrypt(user.accessToken));

    // Fetch all posts from LinkedIn
    let linkedinPosts;
    try {
      linkedinPosts = await linkedInClient.getAllPostsWithEngagement(100);
    } catch (fetchError) {
      console.error('Failed to fetch posts from LinkedIn:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to fetch posts from LinkedIn API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (!linkedinPosts || linkedinPosts.length === 0) {
      return NextResponse.json({
        message: 'No posts found on LinkedIn',
        totalLinkedInPosts: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      });
    }

    // Get existing posts to avoid duplicates
    const existingPosts = await prisma.post.findMany({
      where: {
        userId: session.userId,
        linkedinPostId: { not: null },
      },
      select: { linkedinPostId: true },
    });

    const existingPostIds = new Set(existingPosts.map(p => p.linkedinPostId));

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const linkedinPost of linkedinPosts) {
      try {
        // Check if post already exists
        const postIdVariants = [
          linkedinPost.id,
          linkedinPost.urn,
          `urn:li:share:${linkedinPost.id}`,
          `urn:li:ugcPost:${linkedinPost.id}`,
        ];

        const existingPostId = postIdVariants.find(id => existingPostIds.has(id));

        if (existingPostId) {
          // Update engagement for existing post
          const existingPost = await prisma.post.findFirst({
            where: {
              userId: session.userId,
              linkedinPostId: existingPostId,
            },
          });

          if (existingPost) {
            // Calculate engagement rate
            const engagementRate = linkedinPost.engagement.impressions > 0
              ? ((linkedinPost.engagement.likes + linkedinPost.engagement.comments + linkedinPost.engagement.shares) /
                  linkedinPost.engagement.impressions) * 100
              : 0;

            // Upsert engagement record
            await prisma.postEngagement.upsert({
              where: { postId: existingPost.id },
              create: {
                postId: existingPost.id,
                likes: linkedinPost.engagement.likes,
                comments: linkedinPost.engagement.comments,
                shares: linkedinPost.engagement.shares,
                impressions: linkedinPost.engagement.impressions,
                clicks: linkedinPost.engagement.clicks,
                engagement: engagementRate,
              },
              update: {
                likes: linkedinPost.engagement.likes,
                comments: linkedinPost.engagement.comments,
                shares: linkedinPost.engagement.shares,
                impressions: linkedinPost.engagement.impressions,
                clicks: linkedinPost.engagement.clicks,
                engagement: engagementRate,
                fetchedAt: new Date(),
              },
            });

            results.updated++;
          }
        } else {
          // Import new post
          const engagementRate = linkedinPost.engagement.impressions > 0
            ? ((linkedinPost.engagement.likes + linkedinPost.engagement.comments + linkedinPost.engagement.shares) /
                linkedinPost.engagement.impressions) * 100
            : 0;

          const newPost = await prisma.post.create({
            data: {
              userId: session.userId,
              content: linkedinPost.content || '[No content - media only post]',
              status: 'published',
              publishedAt: linkedinPost.publishedAt,
              linkedinPostId: linkedinPost.urn,
              linkedinPostUrl: `https://www.linkedin.com/feed/update/${linkedinPost.urn}`,
              isImported: true,
              engagement: {
                create: {
                  likes: linkedinPost.engagement.likes,
                  comments: linkedinPost.engagement.comments,
                  shares: linkedinPost.engagement.shares,
                  impressions: linkedinPost.engagement.impressions,
                  clicks: linkedinPost.engagement.clicks,
                  engagement: engagementRate,
                },
              },
            },
          });

          existingPostIds.add(linkedinPost.urn);
          results.imported++;
        }
      } catch (error) {
        console.error(`Failed to process post ${linkedinPost.id}:`, error);
        results.errors.push(linkedinPost.id);
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      totalLinkedInPosts: linkedinPosts.length,
      imported: results.imported,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync posts from LinkedIn' },
      { status: 500 }
    );
  }
}

// GET - Get sync status
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts
    const [totalPosts, importedPosts, postsWithEngagement] = await Promise.all([
      prisma.post.count({
        where: { userId: session.userId, status: 'published' },
      }),
      prisma.post.count({
        where: { userId: session.userId, isImported: true },
      }),
      prisma.post.count({
        where: {
          userId: session.userId,
          status: 'published',
          engagement: { isNot: null },
        },
      }),
    ]);

    // Get last sync time (most recent fetchedAt)
    const lastEngagement = await prisma.postEngagement.findFirst({
      where: {
        post: { userId: session.userId },
      },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    });

    return NextResponse.json({
      totalPosts,
      importedPosts,
      postsWithEngagement,
      lastSyncAt: lastEngagement?.fetchedAt || null,
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
