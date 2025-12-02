'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, CreditCard, Link2, Trash2, ExternalLink } from 'lucide-react';

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
          <div className="w-12 h-12 border-4 border-[#feae34] border-t-transparent mx-auto mb-4 animate-spin" />
          <p className="font-retro text-xl text-[#94a3b8]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div
        className="mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <h1 className="font-pixel text-sm md:text-base text-[#feae34] text-shadow-pixel mb-2">
          SETTINGS
        </h1>
        <p className="font-retro text-xl text-[#94a3b8]">
          Manage your account and preferences
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#e43b44]/20 border-4 border-[#e43b44] mb-6">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 bg-[#0099db] border-2 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <User className="w-5 h-5 text-[#f4f4f4]" />
            </div>
            <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">PROFILE</h2>
          </div>

          {profile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.name}
                    className="w-16 h-16 border-4 border-[#f4f4f4]"
                  />
                ) : (
                  <div
                    className="w-16 h-16 bg-[#0099db] border-4 border-[#f4f4f4] flex items-center justify-center"
                    style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                  >
                    <span className="font-pixel text-sm text-[#f4f4f4]">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel">
                    {profile.name.toUpperCase()}
                  </h3>
                  <p className="font-retro text-lg text-[#94a3b8]">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-[#3a4466]">
                <div>
                  <label className="font-retro text-base text-[#94a3b8] block mb-1">
                    Account Status
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 font-retro text-base border-2 ${
                      profile.accountStatus === 'active'
                        ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                        : 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                    }`}
                  >
                    {profile.accountStatus === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div>
                  <label className="font-retro text-base text-[#94a3b8] block mb-1">
                    Member Since
                  </label>
                  <p className="font-retro text-lg text-[#f4f4f4]">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {profile.linkedinUrl && (
                <div className="pt-4 border-t-2 border-[#3a4466]">
                  <label className="font-retro text-base text-[#94a3b8] block mb-1">
                    LinkedIn Profile
                  </label>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-retro text-lg text-[#0099db] hover:text-[#f4f4f4] transition-colors"
                  >
                    {profile.linkedinUrl}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subscription Section */}
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
            <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">SUBSCRIPTION</h2>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1c2c] border-2 border-[#3a4466]">
                <div>
                  <p className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel">
                    {subscription.plan === 'monthly'
                      ? 'MONTHLY PLAN'
                      : 'ANNUAL PLAN'}
                  </p>
                  <p className="font-retro text-lg text-[#94a3b8]">
                    {subscription.plan === 'monthly'
                      ? '$19/month'
                      : '$190/year (save $38)'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 font-retro text-base border-2 ${
                    subscription.status === 'active'
                      ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                      : subscription.status === 'trialing'
                      ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                      : 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                  }`}
                >
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
                </span>
              </div>

              {subscription.currentPeriodEnd && (
                <p className="font-retro text-lg text-[#94a3b8]">
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
                className="w-full font-retro text-lg bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                {isManagingBilling ? 'OPENING...' : 'MANAGE BILLING'}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
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

        {/* LinkedIn Connection */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 bg-[#0099db] border-2 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <Link2 className="w-5 h-5 text-[#f4f4f4]" />
            </div>
            <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">LINKEDIN CONNECTION</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1a1c2c] border-2 border-[#3a4466]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-[#0099db] border-2 border-[#f4f4f4] flex items-center justify-center"
              >
                <span className="font-pixel text-xs text-[#f4f4f4]">in</span>
              </div>
              <div>
                <p className="font-retro text-lg text-[#f4f4f4]">LinkedIn</p>
                <p className="font-retro text-base text-[#94a3b8]">
                  {profile?.linkedinUrl ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {profile?.linkedinUrl ? (
              <span className="font-retro text-lg text-[#63c74d]">
                Connected
              </span>
            ) : (
              <a
                href="/api/auth/linkedin"
                className="font-retro text-lg bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-2 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
              >
                Connect
              </a>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className="bg-[#262b44] border-4 border-[#e43b44] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 bg-[#e43b44] border-2 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
            >
              <Trash2 className="w-5 h-5 text-[#f4f4f4]" />
            </div>
            <h2 className="font-pixel text-xs text-[#e43b44] text-shadow-pixel">DANGER ZONE</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-retro text-lg text-[#f4f4f4]">Delete Account</p>
              <p className="font-retro text-base text-[#94a3b8]">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="font-retro text-lg text-[#e43b44] border-2 border-[#e43b44] px-4 py-2 hover:bg-[#e43b44] hover:text-[#f4f4f4] transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
