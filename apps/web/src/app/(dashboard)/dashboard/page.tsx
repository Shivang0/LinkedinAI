import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch user's recent posts and drafts
  const [recentPosts, draftCount, scheduledCount] = await Promise.all([
    prisma.post.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.draft.count({
      where: { userId: session.userId },
    }),
    prisma.scheduledPost.count({
      where: {
        post: { userId: session.userId },
        jobStatus: { in: ['pending', 'queued'] },
      },
    }),
  ]);

  const publishedCount = recentPosts.filter((p: { status: string }) => p.status === 'published').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-1">
          Ready to create some engaging LinkedIn content?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/compose"
          className="card hover:shadow-card-hover transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linkedin-blue/10 rounded-lg flex items-center justify-center group-hover:bg-linkedin-blue/20 transition-colors">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create New Post</h3>
              <p className="text-sm text-gray-500">Generate with AI</p>
            </div>
          </div>
        </Link>

        <Link
          href="/drafts"
          className="card hover:shadow-card-hover transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {draftCount} {draftCount === 1 ? 'Draft' : 'Drafts'}
              </h3>
              <p className="text-sm text-gray-500">Continue editing</p>
            </div>
          </div>
        </Link>

        <Link
          href="/calendar"
          className="card hover:shadow-card-hover transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {scheduledCount} Scheduled
              </h3>
              <p className="text-sm text-gray-500">View calendar</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Posts Created" value={recentPosts.length.toString()} />
        <StatCard label="Published" value={publishedCount.toString()} />
        <StatCard label="Scheduled" value={scheduledCount.toString()} />
        <StatCard label="Drafts" value={draftCount.toString()} />
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
          <Link
            href="/compose"
            className="text-sm text-linkedin-blue hover:underline"
          >
            Create new
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No posts yet</p>
            <Link href="/compose" className="btn-primary btn-md">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {post.content.slice(0, 150)}
                    {post.content.length > 150 ? '...' : ''}
                  </p>
                  <StatusBadge status={post.status} />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    publishing: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
