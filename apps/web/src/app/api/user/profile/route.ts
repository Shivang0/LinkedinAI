import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';
import { z } from '@linkedin-ai/shared';

// Validation schema for profile update
const profileUpdateSchema = z.object({
  // Basic Professional Info
  industry: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  yearsExperience: z.number().int().min(0).max(60).nullable().optional(),
  company: z.string().nullable().optional(),

  // Content & Writing
  expertise: z.array(z.string()).optional(),
  writingStyle: z.string().nullable().optional(),
  topicsOfInterest: z.array(z.string()).optional(),

  // Content Preferences
  emojiPreference: z.enum(['none', 'light', 'moderate', 'heavy']).nullable().optional(),
  hashtagUsage: z.enum(['minimal', 'moderate', 'heavy']).nullable().optional(),

  // Audience & Goals
  targetAudience: z.string().nullable().optional(),
  contentStrengths: z.array(z.string()).optional(),
  personalValues: z.array(z.string()).optional(),
});

// GET /api/user/profile - Get current user's profile
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      subscription: {
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
        },
      },
      profile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      linkedinUrl: user.profileUrl,
      profileImageUrl: user.profileImageUrl,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
    },
    profileAnalysis: user.profile,
    subscription: user.subscription,
  });
}

// PUT /api/user/profile - Update user's profile analysis
export async function PUT(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Upsert profile analysis
    const profileAnalysis = await prisma.profileAnalysis.upsert({
      where: { userId: session.userId },
      update: {
        industry: data.industry,
        position: data.position,
        yearsExperience: data.yearsExperience,
        company: data.company,
        expertise: data.expertise,
        writingStyle: data.writingStyle,
        topicsOfInterest: data.topicsOfInterest,
        emojiPreference: data.emojiPreference,
        hashtagUsage: data.hashtagUsage,
        targetAudience: data.targetAudience,
        contentStrengths: data.contentStrengths,
        personalValues: data.personalValues,
      },
      create: {
        userId: session.userId,
        industry: data.industry,
        position: data.position,
        yearsExperience: data.yearsExperience,
        company: data.company,
        expertise: data.expertise || [],
        writingStyle: data.writingStyle,
        topicsOfInterest: data.topicsOfInterest || [],
        emojiPreference: data.emojiPreference,
        hashtagUsage: data.hashtagUsage,
        targetAudience: data.targetAudience,
        contentStrengths: data.contentStrengths || [],
        personalValues: data.personalValues || [],
      },
    });

    return NextResponse.json({ profileAnalysis });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
