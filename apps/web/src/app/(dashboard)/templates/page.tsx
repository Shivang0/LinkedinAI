'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, X, Zap } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'story', label: 'Personal Story' },
  { value: 'tips', label: 'Tips & Advice' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'thought-leadership', label: 'Thought Leadership' },
  { value: 'engagement', label: 'Engagement' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates');
      }

      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          content: formContent,
          category: formCategory || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template');
      }

      setTemplates([data.template, ...templates]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUseTemplate = (template: Template) => {
    const params = new URLSearchParams({
      templateId: template.id,
      content: template.content,
    });
    router.push(`/compose?${params.toString()}`);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormContent('');
    setFormCategory('');
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#feae34] border-t-transparent mx-auto mb-4 animate-spin" />
          <p className="font-retro text-xl text-[#94a3b8]">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <div>
          <h1 className="font-pixel text-sm md:text-base text-[#b55088] text-shadow-pixel mb-2">
            TEMPLATES
          </h1>
          <p className="font-retro text-xl text-[#94a3b8]">
            Save and reuse your best-performing post structures
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#e43b44]/20 border-4 border-[#e43b44] mb-6">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-2 font-retro text-base border-2 transition-all ${
              selectedCategory === category.value
                ? 'bg-[#b55088] text-[#f4f4f4] border-[#f4f4f4]'
                : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-12 text-center"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div
            className="w-16 h-16 bg-[#b55088] border-4 border-[#f4f4f4] flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <FileText className="w-8 h-8 text-[#f4f4f4]" />
          </div>
          <h2 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel mb-3">
            {selectedCategory === 'all'
              ? 'NO TEMPLATES YET'
              : 'NO TEMPLATES IN THIS CATEGORY'}
          </h2>
          <p className="font-retro text-xl text-[#94a3b8] mb-6">
            Create templates to quickly reuse your best post structures
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 font-retro text-lg bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 hover:border-[#feae34] transition-colors"
              style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-pixel text-[10px] text-[#f4f4f4] text-shadow-pixel">
                    {template.name.toUpperCase()}
                  </h3>
                  {template.category && (
                    <span className="font-retro text-base text-[#b55088]">
                      {template.category}
                    </span>
                  )}
                </div>
                <span className="font-retro text-base text-[#94a3b8]">
                  Used {template.usageCount}x
                </span>
              </div>

              {template.description && (
                <p className="font-retro text-lg text-[#94a3b8] mb-3">
                  {template.description}
                </p>
              )}

              <div className="p-3 bg-[#1a1c2c] border-2 border-[#3a4466] mb-4">
                <p className="font-retro text-base text-[#f4f4f4] line-clamp-4 whitespace-pre-wrap">
                  {template.content.slice(0, 200)}
                  {template.content.length > 200 ? '...' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-2 font-retro text-base bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-2 border-[#f4f4f4] px-3 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                  style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
                >
                  <Zap className="w-4 h-4" />
                  Use
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  disabled={deletingId === template.id}
                  className="flex items-center justify-center gap-2 font-retro text-base bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-2 border-[#f4f4f4] px-3 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                  style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === template.id ? '...' : ''}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#262b44] border-4 border-[#f4f4f4] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '8px 8px 0 #0a0a0f' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-pixel text-xs text-[#feae34] text-shadow-pixel">
                  CREATE TEMPLATE
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="w-8 h-8 border-2 border-[#f4f4f4] bg-[#e43b44] flex items-center justify-center hover:bg-[#c42f37] transition-colors"
                >
                  <X className="w-4 h-4 text-[#f4f4f4]" />
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label htmlFor="name" className="font-retro text-lg text-[#f4f4f4] mb-2 block">
                    Template Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Weekly Tips Format"
                    className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="font-retro text-lg text-[#f4f4f4] mb-2 block">
                    Description
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of when to use this"
                    className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="font-retro text-lg text-[#f4f4f4] mb-2 block">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] focus:outline-none focus:border-[#feae34]"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="content" className="font-retro text-lg text-[#f4f4f4] mb-2 block">
                    Template Content *
                  </label>
                  <textarea
                    id="content"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Enter your template content..."
                    className="w-full min-h-[200px] bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34] resize-none"
                    rows={8}
                    required
                  />
                  <p className="font-retro text-base text-[#94a3b8] mt-1">
                    Tip: Use placeholders like [TOPIC], [POINT1], [NAME]
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 font-retro text-lg bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                    style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formName || !formContent}
                    className="flex-1 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                    style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                  >
                    {isSubmitting ? 'CREATING...' : 'CREATE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
