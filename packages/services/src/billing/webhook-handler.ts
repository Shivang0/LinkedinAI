import type Stripe from 'stripe';
import { prisma } from '@linkedin-ai/database';

/**
 * Handles checkout.session.completed webhook
 * This activates the user's subscription after successful payment
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !customerId || !subscriptionId) {
    console.error('Missing required data in checkout session', {
      userId,
      customerId,
      subscriptionId,
    });
    return;
  }

  // Import Stripe to get subscription details
  const { getSubscription } = await import('./stripe-client');
  const subscription = await getSubscription(subscriptionId);

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price?.id;
  const plan =
    priceId === process.env.STRIPE_PRICE_MONTHLY
      ? 'premium_monthly'
      : 'premium_annual';

  // Create or update subscription record
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan: plan as 'premium_monthly' | 'premium_annual',
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan: plan as 'premium_monthly' | 'premium_annual',
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Activate user account
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: 'active' },
  });

  console.log(`User ${userId} subscription activated with plan ${plan}`);
}

/**
 * Handles customer.subscription.updated webhook
 * Updates subscription details when plan changes or renews
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error('Subscription not found for customer', customerId);
    return;
  }

  // Determine new plan from price
  const priceId = subscription.items.data[0]?.price?.id;
  const plan =
    priceId === process.env.STRIPE_PRICE_MONTHLY
      ? 'premium_monthly'
      : 'premium_annual';

  // Map Stripe status to our status
  const statusMap: Record<string, 'active' | 'past_due' | 'canceled'> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    trialing: 'active',
    paused: 'canceled',
  };

  const status = statusMap[subscription.status] || 'active';

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan: plan as 'premium_monthly' | 'premium_annual',
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`Subscription ${subscription.id} updated to ${plan}, status: ${status}`);
}

/**
 * Handles customer.subscription.deleted webhook
 * Marks subscription as canceled
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!dbSubscription) {
    console.error('Subscription not found for customer', customerId);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: { status: 'canceled' },
  });

  // Update user account status
  await prisma.user.update({
    where: { id: dbSubscription.userId },
    data: { accountStatus: 'canceled' },
  });

  console.log(`User ${dbSubscription.userId} subscription canceled`);
}

/**
 * Handles invoice.payment_succeeded webhook
 * Records successful payment
 */
export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    // Might be first payment, handled by checkout.session.completed
    return;
  }

  // Store invoice record
  await prisma.invoice.create({
    data: {
      userId: dbSubscription.userId,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'paid',
      invoicePdfUrl: invoice.invoice_pdf || undefined,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    },
  });

  console.log(`Invoice ${invoice.id} recorded for user ${dbSubscription.userId}`);
}

/**
 * Handles invoice.payment_failed webhook
 * Handles payment failures and suspends account after multiple failures
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  const attemptCount = invoice.attempt_count || 1;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!dbSubscription) {
    return;
  }

  console.log(
    `Payment failed for user ${dbSubscription.userId}, attempt ${attemptCount}`
  );

  // After 3 failures, suspend the account
  if (attemptCount >= 3) {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: { accountStatus: 'suspended' },
    });

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'past_due' },
    });

    console.log(`User ${dbSubscription.userId} suspended due to payment failure`);
  }
}

/**
 * Main webhook handler that routes events to specific handlers
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled webhook event: ${event.type}`);
  }
}
