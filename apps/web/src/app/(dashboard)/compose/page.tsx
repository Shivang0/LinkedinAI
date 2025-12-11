'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Calendar, Clock, Sparkles, Save, Send, BarChart3, Type } from 'lucide-react';
import { EmojiPicker } from '@/components/emoji-picker';
import { MediaUpload, type MediaFile } from '@/components/media-upload';
import { PollPreview } from '@/components/poll-preview';
import { FormatToolbar } from '@/components/format-toolbar';
import { BulletPicker } from '@/components/bullet-picker';

// Schedule Modal Component
function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  isScheduling,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
  isScheduling: boolean;
}) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!scheduledDate || !scheduledTime) return;
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    onSchedule(dateTime);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="bg-[#262b44] border-4 border-[#f4f4f4] w-full max-w-md p-6 m-4"
        style={{ boxShadow: '8px 8px 0 #0a0a0f' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-pixel text-xs text-[#feae34] text-shadow-pixel">
            SCHEDULE POST
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-[#f4f4f4] bg-[#e43b44] flex items-center justify-center hover:bg-[#c42f37] transition-colors"
          >
            <X className="w-4 h-4 text-[#f4f4f4]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="schedule-date" className="font-retro text-lg text-[#f4f4f4] mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              id="schedule-date"
              type="date"
              min={today}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] focus:outline-none focus:border-[#feae34]"
            />
          </div>

          <div>
            <label htmlFor="schedule-time" className="font-retro text-lg text-[#f4f4f4] mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </label>
            <input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] focus:outline-none focus:border-[#feae34]"
            />
          </div>

          {scheduledDate && scheduledTime && (
            <div className="bg-[#1a1c2c] border-2 border-[#63c74d] p-3">
              <p className="font-retro text-lg text-[#63c74d]">
                Your post will be published on{' '}
                <strong className="text-[#f4f4f4]">
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isScheduling}
            className="flex-1 font-retro text-lg bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!scheduledDate || !scheduledTime || isScheduling}
            className="flex-1 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            {isScheduling ? 'SCHEDULING...' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
  { value: 'storytelling', label: 'Storytelling' },
];

const FORMAT_OPTIONS = [
  { value: 'story', label: 'Personal Story' },
  { value: 'listicle', label: 'List/Tips' },
  { value: 'question', label: 'Question-based' },
  { value: 'opinion', label: 'Opinion/Hot Take' },
  { value: 'how-to', label: 'How-to Guide' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (100-200 words)' },
  { value: 'medium', label: 'Medium (200-400 words)' },
  { value: 'long', label: 'Long (400-600 words)' },
];

const EMOJI_LEVEL_OPTIONS = [
  { value: 'none', label: 'None', icon: '🚫' },
  { value: 'light', label: 'Light', icon: '😊' },
  { value: 'moderate', label: 'Moderate', icon: '😄' },
  { value: 'heavy', label: 'Heavy', icon: '🎉' },
];

export default function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [editScheduledPostId, setEditScheduledPostId] = useState<string | null>(null);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [originalScheduledFor, setOriginalScheduledFor] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [format, setFormat] = useState('story');
  const [length, setLength] = useState('medium');
  const [keyPoints, setKeyPoints] = useState('');
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [emojiLevel, setEmojiLevel] = useState('none');

  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // New state for enhanced compose features
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [autoFormatAI, setAutoFormatAI] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(true);

  // Load draft or scheduled post data from API when editing
  useEffect(() => {
    const draftIdParam = searchParams.get('draftId');
    const editParam = searchParams.get('edit');

    if (editParam) {
      // Loading a scheduled post for editing
      setIsLoadingEdit(true);
      setEditScheduledPostId(editParam);
      fetch(`/api/posts/scheduled/${editParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.scheduledPost) {
            setContent(data.scheduledPost.post.content || '');
            setEditPostId(data.scheduledPost.post.id);
            setOriginalScheduledFor(data.scheduledPost.scheduledFor);
          }
        })
        .catch((err) => {
          console.error('Failed to load scheduled post:', err);
          setError('Failed to load scheduled post');
        })
        .finally(() => setIsLoadingEdit(false));
    } else if (draftIdParam) {
      setDraftId(draftIdParam);
      // Fetch draft content from API
      fetch(`/api/drafts/${draftIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.draft) {
            setTopic(data.draft.title || '');
            setContent(data.draft.content || '');
          }
        })
        .catch((err) => {
          console.error('Failed to load draft:', err);
          setError('Failed to load draft');
        });
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          format,
          length,
          keyPoints: keyPoints.trim()
            ? keyPoints.split('\n').filter(Boolean)
            : undefined,
          includeCallToAction,
          emojiLevel,
          autoFormat: autoFormatAI,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!content.trim()) {
      setError('No content to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // If editing existing draft, update it
      if (draftId) {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: topic || 'Untitled Draft',
            content,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update draft');
        }
      } else {
        // Create new draft
        const response = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: topic || 'Untitled Draft',
            content,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save draft');
        }
      }

      router.push('/drafts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async (scheduledFor: Date) => {
    setIsScheduling(true);
    setError(null);

    try {
      if (editScheduledPostId && editPostId) {
        // Update existing scheduled post
        const response = await fetch(`/api/posts/scheduled/${editScheduledPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            scheduledFor: scheduledFor.toISOString(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update scheduled post');
        }
      } else {
        // Create new scheduled post
        const response = await fetch('/api/posts/scheduled', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            scheduledFor: scheduledFor.toISOString(),
            draftId: draftId || undefined,
            mediaIds: mediaFiles.map((m) => m.id),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to schedule post');
        }
      }

      setShowScheduleModal(false);
      router.push('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async () => {
    if (!content.trim()) {
      setError('No content to publish');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          draftId: draftId || undefined,
          mediaIds: mediaFiles.map((m) => m.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      // Success - redirect to posts page
      router.push('/posts?published=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsPublishing(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // Handle emoji selection - insert at cursor position
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

  // Handle media file management
  const handleMediaAdd = (file: MediaFile) => {
    setMediaFiles((prev) => [...prev, file]);
  };

  const handleMediaRemove = (id: string) => {
    setMediaFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Handle bullet selection - insert at cursor position
  const handleBulletSelect = (bullet: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + bullet + content.slice(end);
      setContent(newContent);
      // Set cursor position after bullet
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + bullet.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(content + bullet);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleConfirmSchedule}
        isScheduling={isScheduling}
      />

      {/* Page Header */}
      <div
        className="mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <h1 className="font-pixel text-sm md:text-base text-[#e43b44] text-shadow-pixel mb-2">
          CREATE NEW POST
        </h1>
        <p className="font-retro text-xl text-[#94a3b8]">
          Generate engaging LinkedIn content with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Generation Settings */}
        <div className="space-y-6">
          <div
            className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
            style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
          >
            <h2 className="font-pixel text-xs text-[#feae34] text-shadow-pixel mb-6">
              CONTENT SETTINGS
            </h2>

            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label htmlFor="topic" className="font-retro text-lg text-[#f4f4f4] mb-2 block">
                  Topic or Subject *
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Why I stopped chasing promotions"
                  className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
                />
              </div>

              {/* Key Points */}
              <div>
                <label htmlFor="keyPoints" className="font-retro text-lg text-[#f4f4f4] mb-2 block">
                  Key Points (optional)
                </label>
                <textarea
                  id="keyPoints"
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Enter key points, one per line..."
                  className="w-full min-h-[80px] bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34] resize-none"
                  rows={3}
                />
                <p className="font-retro text-base text-[#94a3b8] mt-1">
                  Add specific points you want to include
                </p>
              </div>

              {/* Tone */}
              <div>
                <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                        tone === option.value
                          ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                          : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Format</label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormat(option.value)}
                      className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                        format === option.value
                          ? 'bg-[#b55088] text-[#f4f4f4] border-[#f4f4f4]'
                          : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Length</label>
                <div className="flex flex-wrap gap-2">
                  {LENGTH_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLength(option.value)}
                      className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                        length === option.value
                          ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                          : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include CTA */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cta"
                  checked={includeCallToAction}
                  onChange={(e) => setIncludeCallToAction(e.target.checked)}
                  className="w-5 h-5 bg-[#1a1c2c] border-2 border-[#f4f4f4] accent-[#63c74d]"
                />
                <label htmlFor="cta" className="font-retro text-lg text-[#f4f4f4]">
                  Include call-to-action question at the end
                </label>
              </div>

              {/* Emoji Level */}
              <div>
                <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Emoji Level</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LEVEL_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEmojiLevel(option.value)}
                      className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                        emojiLevel === option.value
                          ? 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                          : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
                <p className="font-retro text-base text-[#94a3b8] mt-2">
                  Control how many emojis appear in the generated post
                </p>
              </div>

              {/* Auto-Format AI Output */}
              <div className="flex items-center gap-3 pt-4 border-t-2 border-[#3a4466]">
                <input
                  type="checkbox"
                  id="autoFormat"
                  checked={autoFormatAI}
                  onChange={(e) => setAutoFormatAI(e.target.checked)}
                  className="w-5 h-5 bg-[#1a1c2c] border-2 border-[#f4f4f4] accent-[#0099db]"
                />
                <label htmlFor="autoFormat" className="font-retro text-lg text-[#f4f4f4]">
                  Auto-format AI output (bold headers, styled bullets)
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full mt-6 flex items-center justify-center gap-2 font-retro text-xl bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-6 py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? 'GENERATING...' : 'GENERATE POST'}
            </button>
          </div>
        </div>

        {/* Right Column - Content Editor & Preview */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-[#e43b44]/20 border-4 border-[#e43b44]">
              <p className="font-retro text-lg text-[#e43b44]">{error}</p>
            </div>
          )}

          <div
            className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
            style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-pixel text-xs text-[#63c74d] text-shadow-pixel">POST CONTENT</h2>
              <div className="font-retro text-base text-[#94a3b8]">
                {wordCount} words - {charCount}/3000 chars
              </div>
            </div>

            {/* Format Toolbar */}
            <FormatToolbar
              textareaRef={textareaRef}
              content={content}
              onContentChange={setContent}
            />

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your post content will appear here..."
              className="w-full min-h-[250px] bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-3 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34] resize-none"
              rows={10}
            />

            {charCount > 3000 && (
              <p className="font-retro text-base text-[#e43b44] mt-2">
                Content exceeds LinkedIn&apos;s 3000 character limit
              </p>
            )}

            {/* Compose Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t-2 border-[#3a4466]">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <BulletPicker onBulletSelect={handleBulletSelect} />
              <MediaUpload
                mediaFiles={mediaFiles}
                onMediaAdd={handleMediaAdd}
                onMediaRemove={handleMediaRemove}
                disabled={showPoll}
              />
              <button
                type="button"
                onClick={() => setShowPoll(!showPoll)}
                className={`flex items-center gap-2 font-retro text-base border-2 px-3 py-2 transition-all ${
                  showPoll
                    ? 'bg-[#8bd450] text-[#0a0a0f] border-[#f4f4f4]'
                    : 'bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-[#f4f4f4]'
                } hover:translate-x-[1px] hover:translate-y-[1px]`}
                style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
                title={showPoll ? 'Hide poll' : 'Add poll'}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Poll</span>
              </button>
            </div>

            {/* Poll Preview Panel */}
            {showPoll && (
              <div className="mt-4">
                <PollPreview onClose={() => setShowPoll(false)} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveAsDraft}
                disabled={!content.trim() || isSaving}
                className="flex items-center justify-center gap-2 font-retro text-lg bg-[#feae34] hover:bg-[#e09a2e] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'SAVING...' : 'SAVE DRAFT'}
              </button>
              <button
                onClick={handleSchedule}
                disabled={!content.trim() || charCount > 3000}
                className="flex items-center justify-center gap-2 font-retro text-lg bg-[#0099db] hover:bg-[#0077a8] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <Calendar className="w-4 h-4" />
                SCHEDULE
              </button>
              <button
                onClick={handlePublishNow}
                disabled={!content.trim() || charCount > 3000 || isPublishing}
                className="flex items-center justify-center gap-2 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <Send className="w-4 h-4" />
                {isPublishing ? 'PUBLISHING...' : 'PUBLISH NOW'}
              </button>
            </div>
          </div>

          {/* LinkedIn Preview */}
          {(content || mediaFiles.length > 0) && (
            <div
              className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
              style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
            >
              <h3 className="font-pixel text-xs text-[#0099db] text-shadow-pixel mb-4">
                LINKEDIN PREVIEW
              </h3>
              <div className="bg-[#1a1c2c] border-2 border-[#3a4466] p-4 space-y-4">
                {content && (
                  <div className="font-retro text-lg text-[#f4f4f4] whitespace-pre-wrap">{content}</div>
                )}
                {mediaFiles.length > 0 && (
                  <div className="border-t border-[#3a4466] pt-4">
                    <div className={`grid gap-2 ${
                      mediaFiles.length === 1 ? 'grid-cols-1' :
                      mediaFiles.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                    }`}>
                      {mediaFiles.map((file) => (
                        <div key={file.id} className="aspect-square bg-[#262b44] border border-[#3a4466] overflow-hidden">
                          {file.mimeType.startsWith('image/') ? (
                            <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2">
                              <span className="text-2xl">📄</span>
                              <span className="font-retro text-xs text-[#f4f4f4] text-center truncate w-full mt-1">
                                {file.filename}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
