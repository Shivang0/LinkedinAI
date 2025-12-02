'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';

interface Draft {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/drafts');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch drafts');
      }

      setDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete draft');
      }

      setDrafts(drafts.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (draft: Draft) => {
    router.push(`/compose?draftId=${draft.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#feae34] border-t-transparent mx-auto mb-4 animate-spin" />
          <p className="font-retro text-xl text-[#94a3b8]">Loading drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <div>
          <h1 className="font-pixel text-sm md:text-base text-[#feae34] text-shadow-pixel mb-2">
            DRAFTS
          </h1>
          <p className="font-retro text-xl text-[#94a3b8]">
            {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} saved
          </p>
        </div>
        <Link
          href="/compose"
          className="flex items-center gap-2 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <Plus className="w-4 h-4" />
          Create New
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-[#e43b44]/20 border-4 border-[#e43b44] mb-6">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      {drafts.length === 0 ? (
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-12 text-center"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div
            className="w-16 h-16 bg-[#feae34] border-4 border-[#f4f4f4] flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <FileText className="w-8 h-8 text-[#1a1c2c]" />
          </div>
          <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel mb-3">
            NO DRAFTS YET
          </h2>
          <p className="font-retro text-xl text-[#94a3b8] mb-6">
            Create your first post and save it as a draft
          </p>
          <Link
            href="/compose"
            className="inline-flex items-center gap-2 font-retro text-lg bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Plus className="w-5 h-5" />
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 hover:border-[#feae34] transition-colors"
              style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel truncate">
                    {draft.title || 'UNTITLED DRAFT'}
                  </h3>
                  <p className="font-retro text-lg text-[#94a3b8] mt-2 line-clamp-2">
                    {draft.content.slice(0, 200)}
                    {draft.content.length > 200 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-4 mt-3 font-retro text-base text-[#94a3b8]">
                    <span>
                      Created {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                    <span>|</span>
                    <span>
                      Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </span>
                    <span>|</span>
                    <span>{draft.content.length} chars</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(draft)}
                    className="flex items-center gap-2 font-retro text-base bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-2 border-[#f4f4f4] px-3 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                    style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    disabled={deletingId === draft.id}
                    className="flex items-center gap-2 font-retro text-base bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-2 border-[#f4f4f4] px-3 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                    style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === draft.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
