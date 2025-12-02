import Stripe from 'stripe';

export interface StripeConfig {
  secretKey: string;
  publishableKey?: string;
  webhookSecret?: string;
}

let stripeInstance: Stripe | null = null;

/**
 * Gets or creates a Stripe instance
 */
export function getStripeClient(secretKey?: string): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe secret key is required');
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  return stripeInstance;
}

/**
 * Creates a Stripe checkout session for subscription
 */
export async function createCheckoutSession(options: {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  stripeCustomerId?: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: options.priceId,
        quantity: 1,
      },
    ],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      userId: options.userId,
    },
    subscription_data: {
      metadata: {
        userId: options.userId,
      },
    },
    allow_promotion_codes: true,
    // Required for Stripe India compliance
    billing_address_collection: 'required',
  };

  // Use existing customer or create new
  if (options.stripeCustomerId) {
    sessionParams.customer = options.stripeCustomerId;
  } else {
    sessionParams.customer_email = options.userEmail;
  }

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Creates a Stripe customer portal session
 */
export async function createPortalSession(options: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient();

  return stripe.billingPortal.sessions.create({
    customer: options.stripeCustomerId,
    return_url: options.returnUrl,
  });
}

/**
 * Retrieves a Stripe subscription
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Retrieves a Stripe customer
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    throw new Error('Customer has been deleted');
  }
  return customer as Stripe.Customer;
}

/**
 * Creates a Stripe customer
 */
export async function createCustomer(options: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripeClient();

  return stripe.customers.create({
    email: options.email,
    name: options.name,
    metadata: options.metadata,
  });
}

/**
 * Cancels a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resumes a subscription that was set to cancel
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Changes subscription plan
 */
export async function changeSubscriptionPlan(options: {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  const subscription = await stripe.subscriptions.retrieve(options.subscriptionId);
  const currentItemId = subscription.items.data[0]?.id;

  if (!currentItemId) {
    throw new Error('No subscription item found');
  }

  return stripe.subscriptions.update(options.subscriptionId, {
    items: [
      {
        id: currentItemId,
        price: options.newPriceId,
      },
    ],
    proration_behavior: options.prorationBehavior || 'create_prorations',
  });
}

/**
 * Verifies Stripe webhook signature
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret?: string
): Stripe.Event {
  const stripe = getStripeClient();
  const secret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('Stripe webhook secret is required');
  }

  return stripe.webhooks.constructEvent(body, signature, secret);
}
