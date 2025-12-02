'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserProfile {
  name: string;
  email: string;
  linkedinUrl: string | null;
  profileImageUrl: string | null;
  accountStatus: string;
  createdAt: string;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data.profile);
      setSubscription(data.subscription);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-linkedin-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

          {profile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-linkedin-blue flex items-center justify-center">
                    <span className="text-white text-xl font-medium">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Account Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        profile.accountStatus === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {profile.accountStatus === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Member Since
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {profile.linkedinUrl && (
                <div className="pt-4 border-t">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    LinkedIn Profile
                  </label>
                  <p className="mt-1">
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-linkedin-blue hover:underline"
                    >
                      {profile.linkedinUrl}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Subscription
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {subscription.plan === 'monthly'
                      ? 'Monthly Plan'
                      : 'Annual Plan'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscription.plan === 'monthly'
                      ? '$19/month'
                      : '$190/year (save $38)'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : subscription.status === 'trialing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
                </span>
              </div>

              {subscription.currentPeriodEnd && (
                <p className="text-sm text-gray-500">
                  {subscription.status === 'active'
                    ? 'Renews on '
                    : 'Ends on '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    'en-US',
                    {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )}
                </p>
              )}

              <button
                onClick={handleManageBilling}
                disabled={isManagingBilling}
                className="btn-secondary btn-md w-full disabled:opacity-50"
              >
                {isManagingBilling ? 'Opening...' : 'Manage Billing'}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No active subscription</p>
              <Link href="/checkout" className="btn-primary btn-md">
                Subscribe Now
              </Link>
            </div>
          )}
        </div>

        {/* LinkedIn Connection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            LinkedIn Connection
          </h2>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linkedin-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">in</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">LinkedIn</p>
                <p className="text-sm text-gray-500">
                  {profile?.linkedinUrl ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {profile?.linkedinUrl ? (
              <span className="text-green-600 text-sm font-medium">
                Connected
              </span>
            ) : (
              <a
                href="/api/auth/linkedin"
                className="btn-secondary btn-sm"
              >
                Connect
              </a>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
