import { NextResponse } from 'next/server';
import { prisma } from '@linkedin-ai/database';
import { extractBearerToken, verifyExtensionToken } from '@/lib/extension-auth';

// Input validation
interface LinkedInPostInput {
  urn: string;
  content: string;
  postedAt: number;
  likes: number;
  comments: number;
  reposts: number;
  impressions?: number;
}

interface SyncEngagementRequest {
  posts: LinkedInPostInput[];
}

/**
 * POST /api/extension/sync-engagement
 * Receives engagement data from the extension and syncs it to the database
 */
export async function POST(request: Request) {
  try {
    // Verify extension token
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const payload = await verifyExtensionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: SyncEngagementRequest = await request.json();

    if (!body.posts || !Array.isArray(body.posts)) {
      return NextResponse.json(
        { error: 'Invalid request body: posts array required' },
        { status: 400 }
      );
    }

    // Get user ID from token
    const userId = payload.userId;

    let synced = 0;
    let created = 0;
    let updated = 0;

    // Process each post
    for (const postData of body.posts) {
      try {
        // Validate required fields
        if (!postData.urn) {
          console.warn('[Sync] Skipping post without URN');
          continue;
        }

        // Clean the URN to extract just the post ID
        const linkedinPostId = postData.urn;

        // Check if post exists by LinkedIn post ID
        let post = await prisma.post.findFirst({
          where: {
            userId,
            linkedinPostId,
          },
          include: {
            engagement: true,
          },
        });

        if (post) {
          // Update existing post engagement
          await prisma.postEngagement.upsert({
            where: { postId: post.id },
            update: {
              likes: postData.likes || 0,
              comments: postData.comments || 0,
              shares: postData.reposts || 0,
              impressions: postData.impressions || 0,
              engagement: calculateEngagementRate(
                postData.likes,
                postData.comments,
                postData.reposts,
                postData.impressions
              ),
              fetchedAt: new Date(),
            },
            create: {
              postId: post.id,
              likes: postData.likes || 0,
              comments: postData.comments || 0,
              shares: postData.reposts || 0,
              impressions: postData.impressions || 0,
              engagement: calculateEngagementRate(
                postData.likes,
                postData.comments,
                postData.reposts,
                postData.impressions
              ),
            },
          });
          updated++;
        } else {
          // Create new imported post with engagement data
          post = await prisma.post.create({
            data: {
              userId,
              content: postData.content || '',
              status: 'published',
              publishedAt: postData.postedAt ? new Date(postData.postedAt) : new Date(),
              linkedinPostId,
              isImported: true,
              engagement: {
                create: {
                  likes: postData.likes || 0,
                  comments: postData.comments || 0,
                  shares: postData.reposts || 0,
                  impressions: postData.impressions || 0,
                  engagement: calculateEngagementRate(
                    postData.likes,
                    postData.comments,
                    postData.reposts,
                    postData.impressions
                  ),
                },
              },
            },
            include: {
              engagement: true,
            },
          });
          created++;
        }

        synced++;
      } catch (postError) {
        console.error('[Sync] Error processing post:', postData.urn, postError);
        // Continue with other posts
      }
    }

    console.log(`[Sync] Completed for user ${userId}: ${synced} synced (${created} created, ${updated} updated)`);

    return NextResponse.json({
      success: true,
      synced,
      created,
      updated,
    });
  } catch (error) {
    console.error('[Sync] Error syncing engagement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate engagement rate as a percentage
 */
function calculateEngagementRate(
  likes: number = 0,
  comments: number = 0,
  shares: number = 0,
  impressions: number = 0
): number {
  if (!impressions || impressions === 0) {
    return 0;
  }

  const totalEngagement = likes + comments + shares;
  return (totalEngagement / impressions) * 100;
}
