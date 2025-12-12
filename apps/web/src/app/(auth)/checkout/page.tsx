'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gamepad2, Star, Check, Sparkles, Crown } from 'lucide-react';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');
  const resubscribe = searchParams.get('resubscribe');

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    setLoading(plan);
    setError(null);

    try {
      const priceId =
        plan === 'monthly'
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL;

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1c2c] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#f4f4f4]"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 31) % 100}%`,
              opacity: 0.3 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex justify-center">
          <div
            className="w-16 h-16 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Gamepad2 className="w-8 h-8 text-[#f4f4f4]" />
          </div>
        </div>

        <h2 className="mt-6 text-center font-pixel text-sm md:text-base text-[#f4f4f4] text-shadow-pixel">
          {resubscribe ? 'REACTIVATE YOUR SUBSCRIPTION' : 'COMPLETE YOUR SUBSCRIPTION'}
        </h2>
        <p className="mt-4 text-center font-retro text-xl text-[#94a3b8]">
          {resubscribe
            ? 'Your subscription has ended. Resubscribe to continue using LinkedIn AI.'
            : 'Choose your plan to start creating AI-powered LinkedIn posts'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        {canceled && (
          <div className="mb-6 p-4 bg-[#feae34]/20 border-4 border-[#feae34]">
            <p className="font-retro text-lg text-[#feae34]">
              Payment was canceled. Choose a plan below to try again.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#e43b44]/20 border-4 border-[#e43b44]">
            <p className="font-retro text-lg text-[#e43b44]">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div
            className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
            style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#feae34]" />
              <h3 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">MONTHLY</h3>
            </div>
            <div className="mt-4">
              <span className="font-pixel text-2xl text-[#feae34]">$39</span>
              <span className="font-retro text-xl text-[#94a3b8]">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              <PlanFeature>Unlimited AI-generated posts</PlanFeature>
              <PlanFeature>Advanced scheduling</PlanFeature>
              <PlanFeature>All calendar views</PlanFeature>
              <PlanFeature>Recurring templates</PlanFeature>
              <PlanFeature>AI learning & personalization</PlanFeature>
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={loading !== null}
              className="mt-6 w-full font-retro text-lg bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              {loading === 'monthly' ? 'PROCESSING...' : 'CHOOSE MONTHLY'}
            </button>
          </div>

          {/* Annual Plan */}
          <div
            className="bg-[#262b44] border-4 border-[#0099db] p-6 relative"
            style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
          >
            <div
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0099db] border-2 border-[#f4f4f4] px-3 py-1 flex items-center gap-1"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <Star className="w-3 h-3 text-[#feae34]" />
              <span className="font-retro text-base text-[#f4f4f4]">Save 17%</span>
              <Star className="w-3 h-3 text-[#feae34]" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-[#feae34]" />
              <h3 className="font-pixel text-xs text-[#0099db] text-shadow-pixel">ANNUAL</h3>
            </div>
            <div className="mt-4">
              <span className="font-pixel text-2xl text-[#63c74d]">$390</span>
              <span className="font-retro text-xl text-[#94a3b8]">/year</span>
            </div>
            <p className="font-retro text-base text-[#63c74d] mt-1">Just $32.50/month</p>
            <ul className="mt-6 space-y-3">
              <PlanFeature>Everything in Monthly</PlanFeature>
              <PlanFeature highlight>Save $78 per year</PlanFeature>
              <PlanFeature>Priority support</PlanFeature>
            </ul>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={loading !== null}
              className="mt-6 w-full font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              {loading === 'annual' ? 'PROCESSING...' : 'CHOOSE ANNUAL'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="font-retro text-lg text-[#94a3b8]">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
          <a
            href="/api/auth/logout"
            className="mt-4 inline-block font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors"
          >
            Sign out and go back
          </a>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <div
        className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${
          highlight
            ? 'bg-[#63c74d] border-[#f4f4f4]'
            : 'bg-[#3a4466] border-[#f4f4f4]'
        }`}
      >
        <Check className={`w-3 h-3 ${highlight ? 'text-[#1a1c2c]' : 'text-[#63c74d]'}`} />
      </div>
      <span className={`font-retro text-lg ${highlight ? 'text-[#63c74d]' : 'text-[#f4f4f4]'}`}>
        {children}
      </span>
    </li>
  );
}
