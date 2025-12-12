import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';
import { cancelSubscription } from '@linkedin-ai/services';

/**
 * POST /api/billing/cancel
 * Cancels the user's subscription at the end of the current billing period
 */
export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is already scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Cancel at period end (not immediately)
    await cancelSubscription(subscription.stripeSubscriptionId, false);

    // Update local database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
