'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-linkedin-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">Li</span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {resubscribe ? 'Reactivate Your Subscription' : 'Complete Your Subscription'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {resubscribe
            ? 'Your subscription has ended. Resubscribe to continue using LinkedIn AI.'
            : 'Choose your plan to start creating AI-powered LinkedIn posts'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        {canceled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Payment was canceled. Choose a plan below to try again.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Monthly</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">$19</span>
              <span className="text-gray-500">/month</span>
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
              className="mt-6 w-full btn-secondary btn-lg disabled:opacity-50"
            >
              {loading === 'monthly' ? 'Processing...' : 'Choose Monthly'}
            </button>
          </div>

          {/* Annual Plan */}
          <div className="bg-white rounded-lg shadow-card p-6 border-2 border-linkedin-blue relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-linkedin-blue text-white px-3 py-1 rounded-full text-sm font-medium">
              Save 17%
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Annual</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">$190</span>
              <span className="text-gray-500">/year</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Just $15.83/month</p>
            <ul className="mt-6 space-y-3">
              <PlanFeature>Everything in Monthly</PlanFeature>
              <PlanFeature>Save $38 per year</PlanFeature>
              <PlanFeature>Priority support</PlanFeature>
            </ul>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={loading !== null}
              className="mt-6 w-full btn-primary btn-lg disabled:opacity-50"
            >
              {loading === 'annual' ? 'Processing...' : 'Choose Annual'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
          <a
            href="/api/auth/logout"
            className="mt-4 inline-block text-sm text-gray-600 hover:text-gray-800"
          >
            Sign out and go back
          </a>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-gray-600">
      <svg
        className="w-5 h-5 text-success flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      {children}
    </li>
  );
}
