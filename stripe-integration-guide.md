# Stripe Integration Guide - Paid Only Model
## LinkedIn AI Posting App (No Trial, No Free Tier)

## Pricing Structure

### Premium Plan Only
**Monthly**: $19/month
**Annual**: $190/year (save $38, ~17% off)

All features included:
- Unlimited AI-generated posts
- Advanced scheduling (unlimited timeline)
- All calendar views (month/week/day)
- Recurring post templates
- AI learning and personalization
- Priority support
- Advanced analytics
- Media library
- All features unlocked

**No free tier. No trial period. Payment required before access.**

---

## Stripe Products Setup

### Create in Stripe Dashboard

**Product 1: LinkedIn AI Premium - Monthly**
- Price: $19 USD
- Billing: Monthly recurring
- Price ID: `price_xxxxx` (save to env)

**Product 2: LinkedIn AI Premium - Annual**
- Price: $190 USD
- Billing: Yearly recurring
- Price ID: `price_yyyyy` (save to env)

---

## User Flow

### 1. Sign Up Flow (Payment Required)

```
User visits landing page
→ Clicks "Get Started" ($19/mo clearly shown)
→ Redirects to LinkedIn OAuth
→ User grants LinkedIn permissions
→ Account created with status: "pending_payment"
→ Immediately redirect to Stripe Checkout
→ User selects plan:
   • Monthly: $19/mo
   • Annual: $190/yr (Save 17% badge)
→ User enters payment details
→ Payment processed
→ Stripe webhook: checkout.session.completed
→ Update user status to "active"
→ Redirect to app with success message
→ Begin profile analysis
→ User now has full access
```

**Key Points:**
- User CANNOT access app without payment
- No preview, no demo, no trial
- Clear pricing on landing page
- LinkedIn OAuth first (to get data)
- Payment second (to activate)
- Simple, direct flow

### 2. Payment Failure Flow

```
User completes LinkedIn OAuth
→ Redirects to Stripe Checkout
→ User clicks "Cancel" or payment fails
→ Redirect back to pricing page
→ Show message: "Payment required to continue"
→ CTA: "Complete Payment" (back to Stripe)
→ User account remains "pending_payment"
→ No app access until payment succeeds
```

### 3. Plan Change Flow

```
User in app → Settings → Billing
→ Clicks "Change Plan"
→ Redirects to Stripe Customer Portal
→ User switches monthly ↔ annual
→ Stripe handles proration automatically
→ Webhook: customer.subscription.updated
→ Update database
→ User continues with new plan
```

### 4. Cancellation Flow

```
User → Settings → Billing → Manage Subscription
→ Stripe Customer Portal
→ Cancel subscription
→ Stripe webhook: customer.subscription.deleted
→ Mark subscription as "cancelled"
→ User retains access until period end
→ On period end: Lock account (no access)
→ Data retained for 90 days
→ User can resubscribe anytime (data restored)
→ After 90 days: Permanently delete data
```

---

## Webhook Events

### Endpoint Setup
```
Production: https://api.yourapp.com/webhooks/stripe
Test: https://test-api.yourapp.com/webhooks/stripe
```

### Required Events

**1. checkout.session.completed**
```javascript
// First payment successful
{
  type: "checkout.session.completed",
  data: {
    customer: "cus_xxxxx",
    subscription: "sub_xxxxx",
    amount_total: 1900 // $19.00
  }
}

Actions:
- Create subscription record
- Update user status: pending_payment → active
- Store stripe_customer_id and stripe_subscription_id
- Send welcome email
- Log event
- Return 200 OK
```

**2. customer.subscription.updated**
```javascript
// Plan change or renewal
{
  type: "customer.subscription.updated",
  data: {
    id: "sub_xxxxx",
    plan: "premium_annual", // changed from monthly
    current_period_end: 1704067200
  }
}

Actions:
- Update subscription plan in database
- Update billing period dates
- Send confirmation email
- Return 200 OK
```

**3. customer.subscription.deleted**
```javascript
// User cancelled
{
  type: "customer.subscription.deleted",
  data: {
    id: "sub_xxxxx",
    canceled_at: 1701388800
  }
}

Actions:
- Mark subscription as "canceled"
- Set access_until = current_period_end
- Schedule account lock job
- Send cancellation confirmation email
- Return 200 OK
```

**4. invoice.payment_succeeded**
```javascript
// Successful renewal
{
  type: "invoice.payment_succeeded",
  data: {
    subscription: "sub_xxxxx",
    amount_paid: 1900,
    period_end: 1704067200
  }
}

Actions:
- Extend subscription period
- Send receipt email
- Reset usage analytics counter
- Return 200 OK
```

**5. invoice.payment_failed**
```javascript
// Payment failed (card declined, expired, etc)
{
  type: "invoice.payment_failed",
  data: {
    subscription: "sub_xxxxx",
    attempt_count: 1,
    next_payment_attempt: 1701475200
  }
}

Actions:
- Send payment failed email immediately
- If attempt_count = 1: "Your payment failed, please update card"
- If attempt_count = 2: "Second attempt failed, urgent"
- If attempt_count >= 3: 
  - Suspend account (status = suspended)
  - Lock app access
  - Send final notice
- Return 200 OK
```

---

## Database Schema

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_url TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expiry TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  account_status VARCHAR(50) DEFAULT 'pending_payment',
    -- Values: pending_payment, active, suspended, canceled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_linkedin ON users(linkedin_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(account_status);
```

### subscriptions table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL,
    -- Values: premium_monthly, premium_annual
  status VARCHAR(50) NOT NULL,
    -- Values: active, past_due, canceled
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### invoices table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
    -- Values: paid, open, void, uncollectible
  invoice_pdf_url TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
```

---

## Backend API Endpoints

### POST /api/auth/linkedin/callback
Handle LinkedIn OAuth callback
```typescript
async function handleLinkedInCallback(code: string) {
  // Exchange code for tokens
  const tokens = await getLinkedInTokens(code);
  
  // Get LinkedIn profile
  const profile = await getLinkedInProfile(tokens.access_token);
  
  // Create or get user
  const user = await db.users.upsert({
    where: { linkedinId: profile.id },
    create: {
      linkedinId: profile.id,
      email: profile.email,
      name: profile.name,
      accountStatus: 'pending_payment',
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token)
    },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token)
    }
  });
  
  // If already paid, redirect to app
  if (user.accountStatus === 'active') {
    return redirectToApp(user);
  }
  
  // Otherwise, redirect to Stripe checkout
  return redirectToStripeCheckout(user);
}
```

### POST /api/checkout/create-session
Create Stripe checkout session
```typescript
Request:
{
  userId: "uuid",
  priceId: "price_xxxxx", // monthly or annual
}

async function createCheckoutSession(userId: string, priceId: string) {
  const user = await db.users.findUnique({ where: { id: userId } });
  
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    success_url: `${APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing?canceled=true`,
    metadata: {
      userId: userId
    }
  });
  
  return {
    sessionId: session.id,
    url: session.url
  };
}

Response:
{
  sessionId: "cs_xxxxx",
  url: "https://checkout.stripe.com/..."
}
```

### POST /api/webhooks/stripe
Handle Stripe webhooks
```typescript
async function handleWebhook(req: Request) {
  // Verify signature
  const signature = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCancel(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }
  
  return res.json({ received: true });
}
```

### GET /api/subscription/status
Get user's subscription status
```typescript
async function getSubscriptionStatus(userId: string) {
  const user = await db.users.findUnique({ 
    where: { id: userId },
    include: { subscription: true }
  });
  
  return {
    accountStatus: user.accountStatus,
    plan: user.subscription?.plan,
    currentPeriodEnd: user.subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd
  };
}

Response:
{
  accountStatus: "active",
  plan: "premium_monthly",
  currentPeriodEnd: "2025-12-28",
  cancelAtPeriodEnd: false
}
```

### POST /api/subscription/portal
Create Stripe customer portal session
```typescript
async function createPortalSession(userId: string) {
  const subscription = await db.subscriptions.findUnique({
    where: { userId }
  });
  
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`
  });
  
  return {
    url: session.url
  };
}

Response:
{
  url: "https://billing.stripe.com/..."
}
```

---

## Webhook Handlers

### Checkout Complete
```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Determine plan
  const priceId = subscription.items.data[0].price.id;
  const plan = priceId === process.env.STRIPE_PRICE_MONTHLY 
    ? 'premium_monthly' 
    : 'premium_annual';
  
  // Create subscription record
  await db.subscriptions.create({
    data: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan,
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
  
  // Activate user account
  await db.users.update({
    where: { id: userId },
    data: { accountStatus: 'active' }
  });
  
  // Send welcome email
  await sendWelcomeEmail(userId);
  
  console.log(`User ${userId} activated with ${plan}`);
}
```

### Subscription Update
```typescript
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find subscription
  const dbSub = await db.subscriptions.findUnique({
    where: { stripeCustomerId: customerId }
  });
  
  if (!dbSub) return;
  
  // Update subscription
  const priceId = subscription.items.data[0].price.id;
  const newPlan = priceId === process.env.STRIPE_PRICE_MONTHLY 
    ? 'premium_monthly' 
    : 'premium_annual';
  
  await db.subscriptions.update({
    where: { id: dbSub.id },
    data: {
      plan: newPlan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });
  
  console.log(`Subscription ${subscription.id} updated to ${newPlan}`);
}
```

### Subscription Cancel
```typescript
async function handleSubscriptionCancel(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const dbSub = await db.subscriptions.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: true }
  });
  
  if (!dbSub) return;
  
  // Update subscription status
  await db.subscriptions.update({
    where: { id: dbSub.id },
    data: { status: 'canceled' }
  });
  
  // Schedule account lock at period end
  const lockDate = new Date(subscription.current_period_end * 1000);
  await scheduleAccountLock(dbSub.userId, lockDate);
  
  // Send cancellation email
  await sendCancellationEmail(dbSub.userId, lockDate);
  
  console.log(`User ${dbSub.userId} cancelled, access until ${lockDate}`);
}
```

### Payment Success
```typescript
async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  const dbSub = await db.subscriptions.findUnique({
    where: { stripeSubscriptionId: subscriptionId }
  });
  
  if (!dbSub) return;
  
  // Store invoice
  await db.invoices.create({
    data: {
      userId: dbSub.userId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'paid',
      invoicePdfUrl: invoice.invoice_pdf,
      paidAt: new Date(invoice.status_transitions.paid_at * 1000)
    }
  });
  
  // Send receipt email
  await sendReceiptEmail(dbSub.userId, invoice.invoice_pdf);
  
  console.log(`Payment succeeded for user ${dbSub.userId}`);
}
```

### Payment Failure
```typescript
async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  const dbSub = await db.subscriptions.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { user: true }
  });
  
  if (!dbSub) return;
  
  const attemptCount = invoice.attempt_count;
  
  if (attemptCount === 1) {
    // First failure - gentle reminder
    await sendPaymentFailedEmail(dbSub.userId, 'first');
  } else if (attemptCount === 2) {
    // Second failure - urgent
    await sendPaymentFailedEmail(dbSub.userId, 'urgent');
  } else if (attemptCount >= 3) {
    // Final failure - suspend account
    await db.users.update({
      where: { id: dbSub.userId },
      data: { accountStatus: 'suspended' }
    });
    
    await db.subscriptions.update({
      where: { id: dbSub.id },
      data: { status: 'past_due' }
    });
    
    await sendPaymentFailedEmail(dbSub.userId, 'final');
    
    console.log(`User ${dbSub.userId} suspended due to payment failure`);
  }
}
```

---

## Access Control Middleware

### Require Active Subscription
```typescript
async function requireActiveSubscription(req, res, next) {
  const userId = req.user.id;
  
  const user = await db.users.findUnique({
    where: { id: userId },
    include: { subscription: true }
  });
  
  // Check account status
  if (user.accountStatus === 'pending_payment') {
    return res.status(402).json({
      error: 'Payment required',
      message: 'Please complete payment to access this feature',
      checkoutUrl: '/api/checkout/create-session'
    });
  }
  
  if (user.accountStatus === 'suspended') {
    return res.status(403).json({
      error: 'Account suspended',
      message: 'Your payment failed. Please update your payment method',
      portalUrl: '/api/subscription/portal'
    });
  }
  
  if (user.accountStatus === 'canceled') {
    return res.status(403).json({
      error: 'Subscription canceled',
      message: 'Your subscription has ended. Resubscribe to continue',
      checkoutUrl: '/api/checkout/create-session'
    });
  }
  
  // Check if subscription is active
  if (user.subscription.status !== 'active') {
    return res.status(403).json({
      error: 'Inactive subscription',
      message: 'Your subscription is not active'
    });
  }
  
  // All good, proceed
  next();
}

// Use in routes
app.post('/api/posts/generate', requireActiveSubscription, generatePost);
app.post('/api/posts/schedule', requireActiveSubscription, schedulePost);
app.get('/api/calendar', requireActiveSubscription, getCalendar);
```

---

## Frontend Components

### Landing Page Pricing
```tsx
<section className="pricing">
  <h1>LinkedIn AI Posting - $19/month</h1>
  <p>Unlimited AI-generated posts. Professional content. Easy scheduling.</p>
  
  <div className="plans">
    <div className="plan">
      <h3>Monthly</h3>
      <div className="price">
        <span className="amount">$19</span>
        <span className="period">/month</span>
      </div>
      <ul>
        <li>✓ Unlimited AI posts</li>
        <li>✓ Advanced scheduling</li>
        <li>✓ All calendar views</li>
        <li>✓ Recurring templates</li>
        <li>✓ AI learning</li>
      </ul>
      <button onClick={handleGetStarted}>Get Started</button>
    </div>
    
    <div className="plan featured">
      <div className="badge">Save 17%</div>
      <h3>Annual</h3>
      <div className="price">
        <span className="amount">$190</span>
        <span className="period">/year</span>
      </div>
      <p className="savings">Just $15.83/month</p>
      <ul>
        <li>✓ Everything in Monthly</li>
        <li>✓ Save $38 per year</li>
        <li>✓ Priority support</li>
      </ul>
      <button onClick={handleGetStarted}>Get Started</button>
    </div>
  </div>
  
  <p className="guarantee">
    Cancel anytime. Access until end of billing period.
  </p>
</section>
```

### Payment Flow Component
```tsx
function PaymentRequired() {
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      alert('Error creating checkout session');
      setLoading(false);
    }
  };
  
  return (
    <div className="payment-required">
      <h2>Complete Your Subscription</h2>
      <p>Choose your plan to start using LinkedIn AI Posting</p>
      
      <div className="plans">
        <button 
          onClick={() => handleCheckout(PRICE_ID_MONTHLY)}
          disabled={loading}
        >
          Monthly - $19/mo
        </button>
        
        <button 
          onClick={() => handleCheckout(PRICE_ID_ANNUAL)}
          disabled={loading}
          className="featured"
        >
          Annual - $190/yr (Save 17%)
        </button>
      </div>
    </div>
  );
}
```

### Billing Page
```tsx
function BillingPage() {
  const { subscription } = useSubscription();
  
  const handlePortal = async () => {
    const response = await fetch('/api/subscription/portal', {
      method: 'POST'
    });
    const { url } = await response.json();
    window.location.href = url;
  };
  
  return (
    <div className="billing">
      <h1>Billing & Subscription</h1>
      
      <div className="current-plan">
        <h2>Current Plan</h2>
        <div className="plan-badge">
          {subscription.plan === 'premium_monthly' 
            ? 'Premium Monthly' 
            : 'Premium Annual'}
        </div>
        <p>Next billing date: {formatDate(subscription.currentPeriodEnd)}</p>
        <p>Amount: {subscription.plan === 'premium_monthly' ? '$19' : '$190'}</p>
      </div>
      
      <div className="payment-method">
        <h2>Payment Method</h2>
        <p>•••• •••• •••• {subscription.last4}</p>
      </div>
      
      <button onClick={handlePortal}>
        Manage Subscription
      </button>
      
      <p className="help-text">
        Update payment method, change plan, or cancel subscription
      </p>
    </div>
  );
}
```

### Account Suspended View
```tsx
function AccountSuspended() {
  const handleUpdatePayment = async () => {
    const response = await fetch('/api/subscription/portal', {
      method: 'POST'
    });
    const { url } = await response.json();
    window.location.href = url;
  };
  
  return (
    <div className="suspended">
      <h1>Account Suspended</h1>
      <p>Your payment method was declined multiple times.</p>
      <p>Please update your payment method to restore access.</p>
      
      <button onClick={handleUpdatePayment}>
        Update Payment Method
      </button>
      
      <p className="warning">
        If not resolved within 7 days, your account and data will be deleted.
      </p>
    </div>
  );
}
```

---

## Testing Checklist

### Stripe Test Mode

- [ ] Create test products
- [ ] Use test API keys (pk_test_, sk_test_)
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe`

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires auth: 4000 0025 0000 3155
```

### Payment Flows to Test

**Happy Path:**
- [ ] User signs in with LinkedIn
- [ ] Redirects to Stripe checkout
- [ ] Completes payment (monthly)
- [ ] Webhook activates account
- [ ] User has full app access

**Plan Change:**
- [ ] User switches monthly → annual
- [ ] Proration calculated correctly
- [ ] Subscription updated in database
- [ ] User maintains access

**Cancellation:**
- [ ] User cancels via portal
- [ ] Access maintained until period end
- [ ] Account locked at period end
- [ ] User can resubscribe

**Payment Failure:**
- [ ] First failure → Email sent
- [ ] Second failure → Urgent email
- [ ] Third failure → Account suspended
- [ ] User updates card → Access restored

**Edge Cases:**
- [ ] User abandons checkout → Can retry
- [ ] Webhook delayed → Handle duplicate events
- [ ] User closes browser during payment → Can resume
- [ ] Subscription expires → Prompt to renew

---

## Environment Variables

```bash
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_ANNUAL=price_yyyyy

# App URLs
APP_URL=https://app.yoursite.com
STRIPE_SUCCESS_URL=https://app.yoursite.com/welcome
STRIPE_CANCEL_URL=https://app.yoursite.com/pricing
```

---

## Cost Analysis

### Stripe Fees
**Per transaction:**
- 2.9% + $0.30

**Monthly plan:**
- $19.00 charged
- $0.85 Stripe fee
- $18.15 net revenue

**Annual plan:**
- $190.00 charged
- $5.81 Stripe fee
- $184.19 net revenue

### Monthly Recurring Revenue (MRR)

| Users | MRR (all monthly) | MRR (30% annual) | ARR |
|-------|-------------------|------------------|-----|
| 100   | $1,900            | $2,108           | $25,296 |
| 500   | $9,500            | $10,542          | $126,504 |
| 1,000 | $19,000           | $21,083          | $253,000 |
| 5,000 | $95,000           | $105,417         | $1,265,000 |

### Break-even Analysis

**Fixed Costs (monthly):**
- Infrastructure: $200
- OpenAI API: $500
- Tools & services: $100
- **Total:** $800/month

**Break-even:** ~50 paying users

---

## Security Best Practices

1. **Never expose secret keys** - Server-side only
2. **Always verify webhook signatures** - Prevent fake events
3. **Use HTTPS** - Required for Stripe
4. **Implement idempotency** - Handle duplicate webhooks
5. **Rate limit checkout** - Prevent abuse
6. **Log all payment events** - For debugging and compliance
7. **Encrypt customer data** - Especially LinkedIn tokens
8. **PCI compliance** - Let Stripe handle card data
9. **Monitor failed payments** - Quick resolution
10. **Regular security audits** - Stay compliant

---

## Go Live Checklist

- [ ] Test mode fully validated
- [ ] All webhooks working
- [ ] Error handling tested
- [ ] Email templates ready
- [ ] Stripe products created (live mode)
- [ ] Live API keys added to production
- [ ] Webhook endpoints configured (live mode)
- [ ] Customer portal configured
- [ ] Invoice settings configured
- [ ] Tax settings configured (if needed)
- [ ] Terms of service updated
- [ ] Privacy policy updated
- [ ] Pricing page accurate
- [ ] Refund policy clear
- [ ] Support email ready
- [ ] Monitoring and alerts set up

---

## Support Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing
- Webhook Testing: `stripe listen --forward-to localhost:3000/webhooks/stripe`
- Customer Portal: Auto-configured via dashboard

---

## Launch Strategy

### Early Bird Pricing
**First 100 users:** $14/month (instead of $19)
- Creates urgency
- Rewards early adopters
- Locks in users before regular pricing
- Lifetime discount for first 100

### Referral Program
**Give 1 month free, Get 1 month free**
- User refers friend
- Friend signs up and pays
- Both get 1 month free credit
- Applied automatically to next invoice

### Annual Push
**Save 17% messaging**
- Emphasize annual savings
- Show "$15.83/month" when billed annually
- Better cash flow
- Lower churn

---

That's it! A complete paid-only Stripe integration with no trial, no free tier. Clean, simple, profitable. 🚀