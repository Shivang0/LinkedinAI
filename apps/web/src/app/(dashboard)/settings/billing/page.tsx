'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Receipt, Download } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/user/billing');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch billing data');
      }

      setSubscription(data.subscription);
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsManagingBilling(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel? You will still have access until the end of your billing period.')) {
      return;
    }

    setIsCanceling(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/cancel', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      fetchBillingData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsResuming(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/resume', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume subscription');
      }

      fetchBillingData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsResuming(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#feae34] border-t-transparent mx-auto mb-4 animate-spin" />
          <p className="font-retro text-xl text-[#94a3b8]">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-retro text-lg">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-[#94a3b8] hover:text-[#feae34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-[#3a4466]">/</span>
        <span className="text-[#f4f4f4]">Billing</span>
      </div>

      {/* Header */}
      <div
        className="mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <h1 className="font-pixel text-sm md:text-base text-[#63c74d] text-shadow-pixel mb-2">
          BILLING & INVOICES
        </h1>
        <p className="font-retro text-xl text-[#94a3b8]">
          Manage your subscription and view billing history
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#e43b44]/20 border-4 border-[#e43b44] mb-6">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Current Plan */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 bg-[#63c74d] border-2 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <CreditCard className="w-5 h-5 text-[#1a1c2c]" />
            </div>
            <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">CURRENT PLAN</h2>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0099db]/10 border-2 border-[#0099db]">
                <div>
                  <p className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">
                    {subscription.plan.includes('monthly')
                      ? 'MONTHLY PLAN'
                      : 'ANNUAL PLAN'}
                  </p>
                  <p className="font-retro text-xl text-[#94a3b8]">
                    {subscription.plan.includes('monthly')
                      ? '$39 per month'
                      : '$390 per year (save $78)'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 font-retro text-base border-2 ${
                    subscription.status === 'active'
                      ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                      : subscription.status === 'trialing'
                      ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                      : subscription.status === 'canceled'
                      ? 'bg-[#e43b44] text-[#f4f4f4] border-[#f4f4f4]'
                      : 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                  }`}
                >
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
                </span>
              </div>

              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between font-retro text-lg">
                  <span className="text-[#94a3b8]">
                    {subscription.status === 'canceled'
                      ? 'Access ends'
                      : subscription.cancelAtPeriodEnd
                      ? 'Cancels on'
                      : 'Next billing date'}
                  </span>
                  <span className="text-[#f4f4f4]">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="p-4 bg-[#feae34]/20 border-2 border-[#feae34]">
                  <p className="font-retro text-lg text-[#feae34]">
                    Your subscription will be canceled on{' '}
                    {new Date(subscription.currentPeriodEnd!).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    . You will still have access until then.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleManageBilling}
                  disabled={isManagingBilling}
                  className="flex-1 font-retro text-lg bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                  style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                >
                  {isManagingBilling ? 'OPENING...' : 'MANAGE BILLING'}
                </button>

                {subscription.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleResumeSubscription}
                    disabled={isResuming}
                    className="flex-1 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                    style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                  >
                    {isResuming ? 'RESUMING...' : 'RESUME SUBSCRIPTION'}
                  </button>
                ) : subscription.status !== 'canceled' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="flex-1 font-retro text-lg bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                    style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                  >
                    {isCanceling ? 'CANCELING...' : 'CANCEL SUBSCRIPTION'}
                  </button>
                )}
              </div>

              <p className="font-retro text-base text-[#94a3b8] text-center">
                Manage payment method via billing portal
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 bg-[#3a4466] border-4 border-[#f4f4f4] flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <CreditCard className="w-8 h-8 text-[#94a3b8]" />
              </div>
              <p className="font-retro text-xl text-[#94a3b8] mb-4">No active subscription</p>
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 font-retro text-lg bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                Subscribe Now
              </Link>
            </div>
          )}
        </div>

        {/* Billing History */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 bg-[#feae34] border-2 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <Receipt className="w-5 h-5 text-[#1a1c2c]" />
            </div>
            <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">BILLING HISTORY</h2>
          </div>

          {invoices.length === 0 ? (
            <p className="font-retro text-xl text-[#94a3b8] text-center py-6">
              No invoices yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#3a4466]">
                    <th className="text-left py-3 px-2 font-retro text-base text-[#94a3b8]">
                      DATE
                    </th>
                    <th className="text-left py-3 px-2 font-retro text-base text-[#94a3b8]">
                      AMOUNT
                    </th>
                    <th className="text-left py-3 px-2 font-retro text-base text-[#94a3b8]">
                      STATUS
                    </th>
                    <th className="text-right py-3 px-2 font-retro text-base text-[#94a3b8]">
                      INVOICE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-[#3a4466] last:border-0">
                      <td className="py-3 px-2 font-retro text-lg text-[#f4f4f4]">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 font-retro text-lg text-[#f4f4f4]">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 font-retro text-base border-2 ${
                            invoice.status === 'paid'
                              ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                              : invoice.status === 'pending'
                              ? 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                              : 'bg-[#e43b44] text-[#f4f4f4] border-[#f4f4f4]'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button className="flex items-center gap-1 font-retro text-base text-[#0099db] hover:text-[#f4f4f4] transition-colors ml-auto">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Method Info */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 bg-[#b55088] border-2 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <CreditCard className="w-5 h-5 text-[#f4f4f4]" />
            </div>
            <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">PAYMENT METHOD</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1a1c2c] border-2 border-[#3a4466]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-[#3a4466] border-2 border-[#f4f4f4] flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 text-[#94a3b8]" />
              </div>
              <div>
                <p className="font-retro text-lg text-[#f4f4f4]">
                  Managed by Stripe
                </p>
                <p className="font-retro text-base text-[#94a3b8]">
                  Update via billing portal
                </p>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={isManagingBilling}
              className="font-retro text-lg bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-2 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
