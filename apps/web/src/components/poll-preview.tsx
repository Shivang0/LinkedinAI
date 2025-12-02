'use client';

import { useState } from 'react';
import { BarChart3, Copy, Check, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
}

interface PollData {
  question: string;
  options: PollOption[];
  duration: string;
}

interface PollPreviewProps {
  onPollChange?: (poll: PollData | null) => void;
  onClose?: () => void;
}

const DURATION_OPTIONS = [
  { value: '1_day', label: '1 day' },
  { value: '3_days', label: '3 days' },
  { value: '1_week', label: '1 week' },
  { value: '2_weeks', label: '2 weeks' },
];

export function PollPreview({ onPollChange, onClose }: PollPreviewProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [duration, setDuration] = useState('1_week');
  const [copied, setCopied] = useState(false);

  const canAddOption = options.length < 4;
  const canRemoveOption = options.length > 2;

  const addOption = () => {
    if (canAddOption) {
      setOptions([...options, { id: Date.now().toString(), text: '' }]);
    }
  };

  const removeOption = (id: string) => {
    if (canRemoveOption) {
      setOptions(options.filter((opt) => opt.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleCopyToClipboard = async () => {
    const pollText = formatPollForCopy();
    await navigator.clipboard.writeText(pollText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPollForCopy = () => {
    const filledOptions = options.filter((opt) => opt.text.trim());
    const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

    let text = `📊 POLL: ${question}\n\n`;
    filledOptions.forEach((opt, index) => {
      text += `${index + 1}. ${opt.text}\n`;
    });
    text += `\n⏱️ Duration: ${durationLabel}\n`;
    text += `\n---\nVote in the comments or create this poll on LinkedIn!`;

    return text;
  };

  const isValid = question.trim() && options.filter((opt) => opt.text.trim()).length >= 2;

  // Notify parent of poll changes
  const notifyChange = () => {
    if (onPollChange) {
      if (isValid) {
        onPollChange({ question, options, duration });
      } else {
        onPollChange(null);
      }
    }
  };

  return (
    <div className="border-4 border-[#f4f4f4] bg-[#262b44] p-4" style={{ boxShadow: '4px 4px 0 #0a0a0f' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#8bd450]" />
          <h3 className="font-retro text-lg text-[#f4f4f4]">Create Poll</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="font-retro text-sm text-[#f4f4f4] hover:text-[#8bd450] transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-2 mb-4 p-3 bg-[#4a3a2a] border-2 border-[#ffcc00]">
        <AlertTriangle className="w-5 h-5 text-[#ffcc00] flex-shrink-0 mt-0.5" />
        <p className="font-retro text-xs text-[#ffcc00]">
          Polls cannot be posted via API. Copy your poll content and create it directly on LinkedIn.
        </p>
      </div>

      {/* Question Input */}
      <div className="mb-4">
        <label className="font-retro text-sm text-[#a0a8c0] mb-2 block">Poll Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            notifyChange();
          }}
          placeholder="Ask your audience a question..."
          maxLength={140}
          className="w-full font-retro text-base bg-[#1a1f35] text-[#f4f4f4] border-2 border-[#3a4466] px-3 py-2 placeholder:text-[#5a6080] focus:outline-none focus:border-[#8bd450]"
        />
        <span className="font-retro text-xs text-[#5a6080] mt-1 block text-right">
          {question.length}/140
        </span>
      </div>

      {/* Options */}
      <div className="mb-4">
        <label className="font-retro text-sm text-[#a0a8c0] mb-2 block">Options (2-4)</label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="font-retro text-sm text-[#8bd450] w-6">{index + 1}.</span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => {
                  updateOption(option.id, e.target.value);
                  notifyChange();
                }}
                placeholder={`Option ${index + 1}`}
                maxLength={30}
                className="flex-1 font-retro text-sm bg-[#1a1f35] text-[#f4f4f4] border-2 border-[#3a4466] px-3 py-2 placeholder:text-[#5a6080] focus:outline-none focus:border-[#8bd450]"
              />
              {canRemoveOption && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="p-2 text-[#ff6b6b] hover:bg-[#3a4466] transition-colors"
                  title="Remove option"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {canAddOption && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 flex items-center gap-2 font-retro text-sm text-[#8bd450] hover:text-[#a0e860] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        )}
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="font-retro text-sm text-[#a0a8c0] mb-2 block">Poll Duration</label>
        <select
          value={duration}
          onChange={(e) => {
            setDuration(e.target.value);
            notifyChange();
          }}
          className="w-full font-retro text-sm bg-[#1a1f35] text-[#f4f4f4] border-2 border-[#3a4466] px-3 py-2 focus:outline-none focus:border-[#8bd450] cursor-pointer"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      {isValid && (
        <div className="mb-4 p-4 bg-[#1a1f35] border-2 border-[#3a4466]">
          <p className="font-retro text-xs text-[#a0a8c0] mb-2">Preview</p>
          <div className="space-y-2">
            <p className="font-retro text-sm text-[#f4f4f4] font-bold">{question}</p>
            {options
              .filter((opt) => opt.text.trim())
              .map((opt, index) => (
                <div
                  key={opt.id}
                  className="flex items-center gap-2 p-2 bg-[#262b44] border border-[#3a4466]"
                >
                  <div className="w-4 h-4 border-2 border-[#8bd450] rounded-sm" />
                  <span className="font-retro text-sm text-[#f4f4f4]">{opt.text}</span>
                </div>
              ))}
            <p className="font-retro text-xs text-[#5a6080] mt-2">
              Duration: {DURATION_OPTIONS.find((d) => d.value === duration)?.label}
            </p>
          </div>
        </div>
      )}

      {/* Copy Button */}
      <button
        type="button"
        onClick={handleCopyToClipboard}
        disabled={!isValid}
        className={`w-full flex items-center justify-center gap-2 font-retro text-base py-3 transition-all ${
          isValid
            ? 'bg-[#8bd450] hover:bg-[#a0e860] text-[#0a0a0f] border-2 border-[#f4f4f4] hover:translate-x-[1px] hover:translate-y-[1px]'
            : 'bg-[#3a4466] text-[#5a6080] border-2 border-[#5a6080] cursor-not-allowed'
        }`}
        style={isValid ? { boxShadow: '2px 2px 0 #0a0a0f' } : {}}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Poll to Clipboard
          </>
        )}
      </button>
    </div>
  );
}
