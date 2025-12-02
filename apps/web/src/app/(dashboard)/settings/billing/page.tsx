'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManagingBilling, setIsManagingBilling] = useState(false);

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
          <div className="animate-spin w-8 h-8 border-4 border-linkedin-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/settings"
          className="text-gray-500 hover:text-gray-700"
        >
          Settings
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">Billing</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and view billing history
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Current Plan */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Plan
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-linkedin-blue/5 border border-linkedin-blue/20 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {subscription.plan === 'monthly'
                      ? 'Monthly Plan'
                      : 'Annual Plan'}
                  </p>
                  <p className="text-gray-600">
                    {subscription.plan === 'monthly'
                      ? '$19 per month'
                      : '$190 per year (save $38)'}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : subscription.status === 'trialing'
                        ? 'bg-blue-100 text-blue-700'
                        : subscription.status === 'canceled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {subscription.status.charAt(0).toUpperCase() +
                      subscription.status.slice(1)}
                  </span>
                </div>
              </div>

              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {subscription.status === 'canceled'
                      ? 'Access ends'
                      : 'Next billing date'}
                  </span>
                  <span className="text-gray-900">
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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleManageBilling}
                  disabled={isManagingBilling}
                  className="btn-primary btn-md flex-1 disabled:opacity-50"
                >
                  {isManagingBilling ? 'Opening...' : 'Manage Subscription'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Update payment method, change plan, or cancel subscription
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <p className="text-gray-500 mb-4">No active subscription</p>
              <Link href="/checkout" className="btn-primary btn-md">
                Subscribe Now
              </Link>
            </div>
          )}
        </div>

        {/* Billing History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Billing History
          </h2>

          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No invoices yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 px-2 text-sm text-gray-900">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-900">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button className="text-sm text-linkedin-blue hover:underline">
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
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Method
          </h2>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-lg">💳</span>
              </div>
              <div>
                <p className="text-sm text-gray-900">
                  Managed by Stripe
                </p>
                <p className="text-xs text-gray-500">
                  Update via billing portal
                </p>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={isManagingBilling}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
