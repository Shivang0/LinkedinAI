'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Schedule Post
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="schedule-date"
              type="date"
              min={today}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="input"
            />
          </div>

          {scheduledDate && scheduledTime && (
            <p className="text-sm text-gray-600">
              Your post will be published on{' '}
              <strong>
                {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
              </strong>
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isScheduling}
            className="btn-secondary btn-md flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!scheduledDate || !scheduledTime || isScheduling}
            className="btn-primary btn-md flex-1 disabled:opacity-50"
          >
            {isScheduling ? 'Scheduling...' : 'Confirm Schedule'}
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

export default function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draftId, setDraftId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [format, setFormat] = useState('story');
  const [length, setLength] = useState('medium');
  const [keyPoints, setKeyPoints] = useState('');
  const [includeCallToAction, setIncludeCallToAction] = useState(true);

  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load draft data from API when editing
  useEffect(() => {
    const draftIdParam = searchParams.get('draftId');

    if (draftIdParam) {
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
      const response = await fetch('/api/posts/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduledFor: scheduledFor.toISOString(),
          draftId: draftId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule post');
      }

      setShowScheduleModal(false);
      router.push('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsScheduling(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="max-w-6xl mx-auto">
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleConfirmSchedule}
        isScheduling={isScheduling}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-1">
          Generate engaging LinkedIn content with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Generation Settings */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Content Settings</h2>

            <div className="space-y-4">
              {/* Topic */}
              <div>
                <label htmlFor="topic" className="label mb-1 block">
                  Topic or Subject *
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Why I stopped chasing promotions"
                  className="input"
                />
              </div>

              {/* Key Points */}
              <div>
                <label htmlFor="keyPoints" className="label mb-1 block">
                  Key Points (optional)
                </label>
                <textarea
                  id="keyPoints"
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Enter key points, one per line..."
                  className="textarea"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add specific points you want to include
                </p>
              </div>

              {/* Tone */}
              <div>
                <label className="label mb-2 block">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        tone === option.value
                          ? 'bg-linkedin-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="label mb-2 block">Format</label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormat(option.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        format === option.value
                          ? 'bg-linkedin-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="label mb-2 block">Length</label>
                <div className="flex flex-wrap gap-2">
                  {LENGTH_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLength(option.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        length === option.value
                          ? 'bg-linkedin-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include CTA */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cta"
                  checked={includeCallToAction}
                  onChange={(e) => setIncludeCallToAction(e.target.checked)}
                  className="w-4 h-4 text-linkedin-blue rounded border-gray-300 focus:ring-linkedin-blue"
                />
                <label htmlFor="cta" className="text-sm text-gray-700">
                  Include call-to-action question at the end
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="btn-primary btn-lg w-full mt-6 disabled:opacity-50"
            >
              {isGenerating ? (
                <span>Generating...</span>
              ) : (
                <span>Generate Post</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Content Editor & Preview */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Post Content</h2>
              <div className="text-xs text-gray-500">
                {wordCount} words - {charCount}/3000 chars
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your post content will appear here..."
              className="textarea min-h-[300px]"
              rows={12}
            />

            {charCount > 3000 && (
              <p className="text-xs text-red-500 mt-1">
                Content exceeds LinkedIn&apos;s 3000 character limit
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveAsDraft}
                disabled={!content.trim() || isSaving}
                className="btn-secondary btn-md flex-1 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handleSchedule}
                disabled={!content.trim() || charCount > 3000}
                className="btn-primary btn-md flex-1 disabled:opacity-50"
              >
                Schedule Post
              </button>
            </div>
          </div>

          {/* LinkedIn Preview */}
          {content && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">
                LinkedIn Preview
              </h3>
              <div className="linkedin-post-preview">
                <div className="whitespace-pre-wrap">{content}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
