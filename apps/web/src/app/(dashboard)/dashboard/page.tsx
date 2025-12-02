import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';
import { Sparkles, FileText, Calendar, Zap, Trophy, Target } from 'lucide-react';

interface PostType {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
}

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

  const publishedCount = recentPosts.filter((p: PostType) => p.status === 'published').length;

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="mb-8 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <h1 className="font-pixel text-sm md:text-base text-[#63c74d] text-shadow-pixel mb-2">
          WELCOME BACK, {session.name.split(' ')[0].toUpperCase()}!
        </h1>
        <p className="font-retro text-xl text-[#94a3b8]">
          Ready to create some engaging LinkedIn content?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/compose"
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 hover:border-[#feae34] transition-all hover:translate-x-[3px] hover:translate-y-[3px] group"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center group-hover:bg-[#c42f37] transition-colors"
              style={{ boxShadow: '3px 3px 0 #0a0a0f' }}
            >
              <Sparkles className="w-7 h-7 text-[#f4f4f4]" />
            </div>
            <div>
              <h3 className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel">CREATE POST</h3>
              <p className="font-retro text-lg text-[#94a3b8]">Generate with AI</p>
            </div>
          </div>
        </Link>

        <Link
          href="/drafts"
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 hover:border-[#feae34] transition-all hover:translate-x-[3px] hover:translate-y-[3px] group"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 bg-[#feae34] border-4 border-[#f4f4f4] flex items-center justify-center group-hover:bg-[#e09a2e] transition-colors"
              style={{ boxShadow: '3px 3px 0 #0a0a0f' }}
            >
              <FileText className="w-7 h-7 text-[#1a1c2c]" />
            </div>
            <div>
              <h3 className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel">
                {draftCount} {draftCount === 1 ? 'DRAFT' : 'DRAFTS'}
              </h3>
              <p className="font-retro text-lg text-[#94a3b8]">Continue editing</p>
            </div>
          </div>
        </Link>

        <Link
          href="/calendar"
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 hover:border-[#feae34] transition-all hover:translate-x-[3px] hover:translate-y-[3px] group"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 bg-[#63c74d] border-4 border-[#f4f4f4] flex items-center justify-center group-hover:bg-[#4da63a] transition-colors"
              style={{ boxShadow: '3px 3px 0 #0a0a0f' }}
            >
              <Calendar className="w-7 h-7 text-[#f4f4f4]" />
            </div>
            <div>
              <h3 className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel">
                {scheduledCount} SCHEDULED
              </h3>
              <p className="font-retro text-lg text-[#94a3b8]">View calendar</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="POSTS" value={recentPosts.length.toString()} icon={<Zap className="w-5 h-5" />} color="#0099db" />
        <StatCard label="PUBLISHED" value={publishedCount.toString()} icon={<Trophy className="w-5 h-5" />} color="#63c74d" />
        <StatCard label="SCHEDULED" value={scheduledCount.toString()} icon={<Target className="w-5 h-5" />} color="#b55088" />
        <StatCard label="DRAFTS" value={draftCount.toString()} icon={<FileText className="w-5 h-5" />} color="#feae34" />
      </div>

      {/* Recent Posts */}
      <div
        className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">RECENT POSTS</h2>
          <Link
            href="/compose"
            className="font-retro text-lg text-[#feae34] hover:text-[#f4f4f4] transition-colors"
          >
            + Create new
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-retro text-xl text-[#94a3b8] mb-6">NO POSTS YET - START YOUR JOURNEY!</p>
            <Link
              href="/compose"
              className="inline-flex items-center gap-2 font-retro text-lg bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              <Sparkles className="w-5 h-5" />
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post: PostType) => (
              <div
                key={post.id}
                className="p-4 bg-[#1a1c2c] border-2 border-[#3a4466] hover:border-[#f4f4f4] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-retro text-lg text-[#f4f4f4] line-clamp-2">
                    {post.content.slice(0, 150)}
                    {post.content.length > 150 ? '...' : ''}
                  </p>
                  <StatusBadge status={post.status} />
                </div>
                <p className="font-retro text-base text-[#94a3b8] mt-2">
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="bg-[#262b44] border-4 border-[#f4f4f4] p-4 text-center"
      style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
    >
      <div
        className="w-10 h-10 mx-auto mb-2 border-2 border-[#f4f4f4] flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <span className="text-[#f4f4f4]">{icon}</span>
      </div>
      <p className="font-pixel text-lg text-[#f4f4f4]" style={{ color }}>{value}</p>
      <p className="font-retro text-base text-[#94a3b8]">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: '#3a4466', text: '#f4f4f4', border: '#f4f4f4' },
    scheduled: { bg: '#0099db', text: '#f4f4f4', border: '#f4f4f4' },
    publishing: { bg: '#feae34', text: '#1a1c2c', border: '#f4f4f4' },
    published: { bg: '#63c74d', text: '#1a1c2c', border: '#f4f4f4' },
    failed: { bg: '#e43b44', text: '#f4f4f4', border: '#f4f4f4' },
  };

  const style = styles[status] || styles.draft;

  return (
    <span
      className="px-2 py-1 font-retro text-base border-2 whitespace-nowrap"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
