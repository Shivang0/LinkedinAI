'use client';

import { useState, useEffect } from 'react';
import { Save, User, Briefcase, PenTool, Target, Loader2 } from 'lucide-react';

// Options for dropdowns and multi-selects
const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Marketing & Advertising',
  'Consulting',
  'Education',
  'Manufacturing',
  'Retail & E-commerce',
  'Media & Entertainment',
  'Real Estate',
  'Legal',
  'Non-profit',
  'Other',
];

const WRITING_STYLE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
  { value: 'storytelling', label: 'Storytelling' },
];

const CONTENT_STRENGTHS_OPTIONS = [
  'Personal Stories',
  'Data & Statistics',
  'Humor & Wit',
  'Case Studies',
  'Hot Takes / Opinions',
  'How-to Guides',
  'Industry Insights',
  'Leadership Lessons',
  'Career Advice',
];

const PERSONAL_VALUES_OPTIONS = [
  'Innovation',
  'Authenticity',
  'Growth Mindset',
  'Leadership',
  'Community',
  'Excellence',
  'Diversity & Inclusion',
  'Sustainability',
  'Work-Life Balance',
  'Continuous Learning',
];

const EMOJI_OPTIONS = [
  { value: 'none', label: 'None', icon: '🚫' },
  { value: 'light', label: 'Light', icon: '😊' },
  { value: 'moderate', label: 'Moderate', icon: '😄' },
  { value: 'heavy', label: 'Heavy', icon: '🎉' },
];

const HASHTAG_OPTIONS = [
  { value: 'minimal', label: 'Minimal (1-2)' },
  { value: 'moderate', label: 'Moderate (3-5)' },
  { value: 'heavy', label: 'Heavy (5+)' },
];

interface ProfileData {
  industry: string | null;
  position: string | null;
  yearsExperience: number | null;
  company: string | null;
  expertise: string[];
  writingStyle: string | null;
  topicsOfInterest: string[];
  emojiPreference: string | null;
  hashtagUsage: string | null;
  targetAudience: string | null;
  contentStrengths: string[];
  personalValues: string[];
}

// Multi-select tag input component
function TagInput({
  label,
  placeholder,
  tags,
  onChange,
  suggestions,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const filteredSuggestions = suggestions?.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="font-retro text-lg text-[#f4f4f4] mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-[#0099db] text-[#f4f4f4] px-3 py-1 font-retro text-base flex items-center gap-2 border-2 border-[#f4f4f4]"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-[#e43b44] font-bold"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            addTag(input);
          }
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
      />
      {showSuggestions && filteredSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-[#262b44] border-4 border-[#f4f4f4] mt-1 max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 font-retro text-base text-[#f4f4f4] hover:bg-[#3a4466]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    industry: null,
    position: null,
    yearsExperience: null,
    company: null,
    expertise: [],
    writingStyle: null,
    topicsOfInterest: [],
    emojiPreference: 'none',
    hashtagUsage: 'moderate',
    targetAudience: null,
    contentStrengths: [],
    personalValues: [],
  });

  // Load profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.profileAnalysis) {
          setProfile({
            industry: data.profileAnalysis.industry || null,
            position: data.profileAnalysis.position || null,
            yearsExperience: data.profileAnalysis.yearsExperience || null,
            company: data.profileAnalysis.company || null,
            expertise: data.profileAnalysis.expertise || [],
            writingStyle: data.profileAnalysis.writingStyle || null,
            topicsOfInterest: data.profileAnalysis.topicsOfInterest || [],
            emojiPreference: data.profileAnalysis.emojiPreference || 'none',
            hashtagUsage: data.profileAnalysis.hashtagUsage || 'moderate',
            targetAudience: data.profileAnalysis.targetAudience || null,
            contentStrengths: data.profileAnalysis.contentStrengths || [],
            personalValues: data.profileAnalysis.personalValues || [],
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#feae34] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div
        className="mb-6 bg-[#262b44] border-4 border-[#f4f4f4] p-6"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <h1 className="font-pixel text-sm md:text-base text-[#e43b44] text-shadow-pixel mb-2">
          MY PROFILE
        </h1>
        <p className="font-retro text-xl text-[#94a3b8]">
          Customize your profile to help AI generate more personalized content
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-[#63c74d]/20 border-4 border-[#63c74d]">
          <p className="font-retro text-lg text-[#63c74d]">Profile saved successfully!</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-[#e43b44]/20 border-4 border-[#e43b44]">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Professional Background */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-5 h-5 text-[#feae34]" />
            <h2 className="font-pixel text-xs text-[#feae34] text-shadow-pixel">
              PROFESSIONAL BACKGROUND
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Industry */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-2 block">Industry</label>
              <select
                value={profile.industry || ''}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value || null })}
                className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 font-retro text-lg text-[#f4f4f4] focus:outline-none focus:border-[#feae34]"
              >
                <option value="">Select industry...</option>
                {INDUSTRY_OPTIONS.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-2 block">Position / Title</label>
              <input
                type="text"
                value={profile.position || ''}
                onChange={(e) => setProfile({ ...profile, position: e.target.value || null })}
                placeholder="e.g., Senior Product Manager"
                className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
              />
            </div>

            {/* Company */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-2 block">Company</label>
              <input
                type="text"
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value || null })}
                placeholder="e.g., Acme Corp"
                className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
              />
            </div>

            {/* Years of Experience */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-2 block">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="60"
                value={profile.yearsExperience ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    yearsExperience: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="e.g., 10"
                className="w-full h-10 bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Writing Preferences */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <PenTool className="w-5 h-5 text-[#0099db]" />
            <h2 className="font-pixel text-xs text-[#0099db] text-shadow-pixel">
              WRITING PREFERENCES
            </h2>
          </div>

          <div className="space-y-6">
            {/* Writing Style */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Preferred Writing Style</label>
              <div className="flex flex-wrap gap-2">
                {WRITING_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfile({ ...profile, writingStyle: option.value })}
                    className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                      profile.writingStyle === option.value
                        ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                        : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics of Interest */}
            <TagInput
              label="Topics of Interest"
              placeholder="Add topics (e.g., AI, Leadership, Startups)"
              tags={profile.topicsOfInterest}
              onChange={(tags) => setProfile({ ...profile, topicsOfInterest: tags })}
            />

            {/* Expertise */}
            <TagInput
              label="Areas of Expertise"
              placeholder="Add your expertise areas"
              tags={profile.expertise}
              onChange={(tags) => setProfile({ ...profile, expertise: tags })}
            />
          </div>
        </div>

        {/* Section 3: Content Preferences */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[#b55088]" />
            <h2 className="font-pixel text-xs text-[#b55088] text-shadow-pixel">
              CONTENT PREFERENCES
            </h2>
          </div>

          <div className="space-y-6">
            {/* Emoji Preference */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Default Emoji Level</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfile({ ...profile, emojiPreference: option.value })}
                    className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                      profile.emojiPreference === option.value
                        ? 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                        : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hashtag Usage */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Hashtag Usage</label>
              <div className="flex flex-wrap gap-2">
                {HASHTAG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfile({ ...profile, hashtagUsage: option.value })}
                    className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                      profile.hashtagUsage === option.value
                        ? 'bg-[#b55088] text-[#f4f4f4] border-[#f4f4f4]'
                        : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Audience & Goals */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-[#63c74d]" />
            <h2 className="font-pixel text-xs text-[#63c74d] text-shadow-pixel">
              AUDIENCE & GOALS
            </h2>
          </div>

          <div className="space-y-6">
            {/* Target Audience */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-2 block">Target Audience</label>
              <textarea
                value={profile.targetAudience || ''}
                onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value || null })}
                placeholder="Who do you want to reach? e.g., Tech leaders, startup founders, career changers..."
                className="w-full min-h-[80px] bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34] resize-none"
                rows={3}
              />
            </div>

            {/* Content Strengths */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Content Strengths</label>
              <p className="font-retro text-base text-[#94a3b8] mb-3">
                What type of content do you excel at?
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_STRENGTHS_OPTIONS.map((strength) => (
                  <button
                    key={strength}
                    onClick={() => {
                      const newStrengths = profile.contentStrengths.includes(strength)
                        ? profile.contentStrengths.filter((s) => s !== strength)
                        : [...profile.contentStrengths, strength];
                      setProfile({ ...profile, contentStrengths: newStrengths });
                    }}
                    className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                      profile.contentStrengths.includes(strength)
                        ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                        : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                    }`}
                  >
                    {strength}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Values */}
            <div>
              <label className="font-retro text-lg text-[#f4f4f4] mb-3 block">Personal Values</label>
              <p className="font-retro text-base text-[#94a3b8] mb-3">
                Values you want reflected in your content
              </p>
              <div className="flex flex-wrap gap-2">
                {PERSONAL_VALUES_OPTIONS.map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      const newValues = profile.personalValues.includes(value)
                        ? profile.personalValues.filter((v) => v !== value)
                        : [...profile.personalValues, value];
                      setProfile({ ...profile, personalValues: newValues });
                    }}
                    className={`px-3 py-2 font-retro text-base border-2 transition-all ${
                      profile.personalValues.includes(value)
                        ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                        : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 font-retro text-xl bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-6 py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'SAVING...' : 'SAVE PROFILE'}
        </button>
      </div>
    </div>
  );
}
