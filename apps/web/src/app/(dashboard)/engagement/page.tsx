'use client';

import { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MousePointer,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Calendar,
  Loader2,
  Download,
  CheckCircle,
} from 'lucide-react';

interface PostEngagement {
  id: string;
  content: string;
  publishedAt: string | null;
  linkedinPostUrl: string | null;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    clicks: number;
    engagement: number;
    fetchedAt: string;
  } | null;
}

interface EngagementTotals {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

interface EngagementData {
  posts: PostEngagement[];
  totals: EngagementTotals;
  postCount: number;
}

interface SyncStatus {
  totalPosts: number;
  importedPosts: number;
  postsWithEngagement: number;
  lastSyncAt: string | null;
}

interface SyncResult {
  message: string;
  totalLinkedInPosts: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

type SortKey = 'publishedAt' | 'likes' | 'comments' | 'shares';
type SortOrder = 'asc' | 'desc';

export default function EngagementPage() {
  const [data, setData] = useState<EngagementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('publishedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchEngagement = async () => {
    try {
      const response = await fetch('/api/engagement');
      if (!response.ok) throw new Error('Failed to fetch engagement data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEngagement = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/engagement', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to refresh engagement data');

      // Re-fetch to get updated data
      await fetchEngagement();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/engagement/sync');
      if (response.ok) {
        const status = await response.json();
        setSyncStatus(status);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  const syncFromLinkedIn = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/engagement/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to sync posts from LinkedIn');

      const result = await response.json();
      setSyncResult(result);

      // Re-fetch engagement data and sync status
      await Promise.all([fetchEngagement(), fetchSyncStatus()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchEngagement();
    fetchSyncStatus();
  }, []);

  const sortedPosts = data?.posts.slice().sort((a, b) => {
    let aValue: number | string = 0;
    let bValue: number | string = 0;

    switch (sortKey) {
      case 'publishedAt':
        aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        break;
      case 'likes':
        aValue = a.engagement?.likes || 0;
        bValue = b.engagement?.likes || 0;
        break;
      case 'comments':
        aValue = a.engagement?.comments || 0;
        bValue = b.engagement?.comments || 0;
        break;
      case 'shares':
        aValue = a.engagement?.shares || 0;
        bValue = b.engagement?.shares || 0;
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#feae34] animate-spin" />
          <p className="font-retro text-lg text-[#94a3b8]">Loading engagement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div
        className="mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-pixel text-sm md:text-base text-[#63c74d] text-shadow-pixel mb-2">
              POST ENGAGEMENT
            </h1>
            <p className="font-retro text-xl text-[#94a3b8]">
              Track your LinkedIn post performance
            </p>
            {syncStatus && (
              <p className="font-retro text-sm text-[#5a6080] mt-1">
                {syncStatus.importedPosts} imported posts | Last sync: {syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleDateString() : 'Never'}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={syncFromLinkedIn}
              disabled={isSyncing}
              className="flex items-center gap-2 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              <Download className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
              {isSyncing ? 'SYNCING...' : 'SYNC LINKEDIN'}
            </button>
            <button
              onClick={refreshEngagement}
              disabled={isRefreshing}
              className="flex items-center gap-2 font-retro text-lg bg-[#0099db] hover:bg-[#0088c7] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'REFRESHING...' : 'REFRESH ALL'}
            </button>
          </div>
        </div>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div
          className="mb-6 p-4 bg-[#63c74d]/20 border-4 border-[#63c74d]"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-[#63c74d]" />
            <span className="font-retro text-lg text-[#63c74d]">Sync Complete!</span>
          </div>
          <div className="font-retro text-base text-[#f4f4f4] grid grid-cols-2 sm:grid-cols-4 gap-2">
            <span>Found: {syncResult.totalLinkedInPosts}</span>
            <span>Imported: {syncResult.imported}</span>
            <span>Updated: {syncResult.updated}</span>
            {syncResult.errors > 0 && <span className="text-[#feae34]">Errors: {syncResult.errors}</span>}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-[#e43b44]/20 border-4 border-[#e43b44]">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-4"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-[#e43b44]" />
            <span className="font-retro text-base text-[#94a3b8]">Likes</span>
          </div>
          <p className="font-pixel text-sm text-[#f4f4f4]">{data?.totals.likes || 0}</p>
        </div>

        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-4"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#0099db]" />
            <span className="font-retro text-base text-[#94a3b8]">Comments</span>
          </div>
          <p className="font-pixel text-sm text-[#f4f4f4]">{data?.totals.comments || 0}</p>
        </div>

        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-4"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-[#63c74d]" />
            <span className="font-retro text-base text-[#94a3b8]">Shares</span>
          </div>
          <p className="font-pixel text-sm text-[#f4f4f4]">{data?.totals.shares || 0}</p>
        </div>

        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-4"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-[#b55088]" />
            <span className="font-retro text-base text-[#94a3b8]">Views</span>
          </div>
          <p className="font-pixel text-sm text-[#f4f4f4]">{data?.totals.impressions || 0}</p>
        </div>

        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-4"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#feae34]" />
            <span className="font-retro text-base text-[#94a3b8]">Posts</span>
          </div>
          <p className="font-pixel text-sm text-[#f4f4f4]">{data?.postCount || 0}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div
        className="mb-4 bg-[#262b44] border-4 border-[#f4f4f4] p-4"
        style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-retro text-base text-[#94a3b8]">Sort by:</span>
          {[
            { key: 'publishedAt', label: 'Date' },
            { key: 'likes', label: 'Likes' },
            { key: 'comments', label: 'Comments' },
            { key: 'shares', label: 'Shares' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key as SortKey)}
              className={`px-3 py-1 font-retro text-base border-2 transition-all ${
                sortKey === key
                  ? 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                  : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
              }`}
            >
              {label} {sortKey === key && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {!data?.posts.length ? (
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-8 text-center"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <TrendingUp className="w-12 h-12 text-[#3a4466] mx-auto mb-4" />
          <p className="font-retro text-xl text-[#94a3b8] mb-2">No published posts yet</p>
          <p className="font-retro text-base text-[#5a6080]">
            Create and publish posts to track their engagement
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts?.map((post) => (
            <div
              key={post.id}
              className="bg-[#262b44] border-4 border-[#f4f4f4] p-4"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Post Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#5a6080]" />
                    <span className="font-retro text-sm text-[#5a6080]">
                      {formatDate(post.publishedAt)}
                    </span>
                    {post.linkedinPostUrl && (
                      <a
                        href={post.linkedinPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-retro text-sm text-[#0099db] hover:text-[#0088c7]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    )}
                  </div>
                  <p className="font-retro text-lg text-[#f4f4f4] whitespace-pre-wrap">
                    {truncateContent(post.content)}
                  </p>
                </div>

                {/* Engagement Metrics */}
                <div className="flex flex-wrap lg:flex-col gap-3 lg:gap-2 lg:min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#e43b44]" />
                    <span className="font-retro text-base text-[#f4f4f4]">
                      {post.engagement?.likes || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#0099db]" />
                    <span className="font-retro text-base text-[#f4f4f4]">
                      {post.engagement?.comments || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#63c74d]" />
                    <span className="font-retro text-base text-[#f4f4f4]">
                      {post.engagement?.shares || 0}
                    </span>
                  </div>
                  {post.engagement?.impressions ? (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#b55088]" />
                      <span className="font-retro text-base text-[#f4f4f4]">
                        {post.engagement.impressions}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Last Updated */}
              {post.engagement?.fetchedAt && (
                <div className="mt-3 pt-3 border-t border-[#3a4466]">
                  <span className="font-retro text-xs text-[#5a6080]">
                    Last updated: {formatDate(post.engagement.fetchedAt)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Note about API */}
      <div className="mt-6 p-4 bg-[#1a1c2c] border-2 border-[#3a4466]">
        <p className="font-retro text-sm text-[#5a6080]">
          <strong className="text-[#63c74d]">Sync LinkedIn:</strong> Import all your previous posts and their engagement metrics.
          <br />
          <strong className="text-[#0099db]">Refresh All:</strong> Update engagement metrics for existing posts.
        </p>
      </div>
    </div>
  );
}
