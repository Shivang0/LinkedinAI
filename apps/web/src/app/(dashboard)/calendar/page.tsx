'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, X, Clock } from 'lucide-react';

interface ScheduledPost {
  id: string;
  scheduledFor: string;
  jobStatus: string;
  post: {
    id: string;
    content: string;
    status: string;
  };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/posts/scheduled');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scheduled posts');
      }

      setScheduledPosts(data.scheduledPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty days for the start of the week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduledFor);
      return (
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getDate() === date.getDate()
      );
    });
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
    setSelectedDate(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const handleCancelPost = async (scheduledPostId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/scheduled/${scheduledPostId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel post');
      }

      setScheduledPosts(scheduledPosts.filter((p) => p.id !== scheduledPostId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#feae34] border-t-transparent mx-auto mb-4 animate-spin" />
          <p className="font-retro text-xl text-[#94a3b8]">Loading calendar...</p>
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
          <h1 className="font-pixel text-sm md:text-base text-[#63c74d] text-shadow-pixel mb-2">
            CONTENT CALENDAR
          </h1>
          <p className="font-retro text-xl text-[#94a3b8]">
            {scheduledPosts.length} {scheduledPosts.length === 1 ? 'post' : 'posts'} scheduled
          </p>
        </div>
        <Link
          href="/compose"
          className="flex items-center gap-2 font-retro text-lg bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
          style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
        >
          <Plus className="w-4 h-4" />
          Schedule New
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-[#e43b44]/20 border-4 border-[#e43b44] mb-6">
          <p className="font-retro text-lg text-[#e43b44]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div
            className="bg-[#262b44] border-4 border-[#f4f4f4] p-6"
            style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="w-10 h-10 border-2 border-[#f4f4f4] bg-[#1a1c2c] flex items-center justify-center hover:bg-[#3a4466] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#f4f4f4]" />
              </button>
              <h2 className="font-pixel text-xs text-[#feae34] text-shadow-pixel">
                {MONTHS[currentDate.getMonth()].toUpperCase()} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="w-10 h-10 border-2 border-[#f4f4f4] bg-[#1a1c2c] flex items-center justify-center hover:bg-[#3a4466] transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-[#f4f4f4]" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center font-retro text-base text-[#94a3b8] py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-20" />;
                }

                const postsForDay = getPostsForDate(date);
                const isSelected =
                  selectedDate &&
                  date.getFullYear() === selectedDate.getFullYear() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getDate() === selectedDate.getDate();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`h-20 p-1 border-2 transition-colors text-left ${
                      isSelected
                        ? 'border-[#feae34] bg-[#feae34]/10'
                        : 'border-[#3a4466] hover:border-[#f4f4f4]'
                    } ${isToday(date) ? 'bg-[#0099db]/20' : ''}`}
                  >
                    <span
                      className={`font-retro text-base ${
                        isToday(date)
                          ? 'text-[#0099db] font-bold'
                          : 'text-[#f4f4f4]'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {postsForDay.length > 0 && (
                      <div className="mt-1">
                        {postsForDay.slice(0, 2).map((post) => (
                          <div
                            key={post.id}
                            className={`font-retro text-xs px-1 py-0.5 truncate mb-0.5 ${
                              post.jobStatus === 'pending'
                                ? 'bg-[#0099db] text-[#f4f4f4]'
                                : post.jobStatus === 'completed'
                                ? 'bg-[#63c74d] text-[#1a1c2c]'
                                : 'bg-[#feae34] text-[#1a1c2c]'
                            }`}
                          >
                            {new Date(post.scheduledFor).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </div>
                        ))}
                        {postsForDay.length > 2 && (
                          <div className="font-retro text-xs text-[#94a3b8]">
                            +{postsForDay.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="lg:col-span-1">
          <div
            className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 sticky top-20"
            style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
          >
            <h3 className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel mb-4">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  }).toUpperCase()
                : 'SELECT A DATE'}
            </h3>

            {!selectedDate ? (
              <p className="font-retro text-lg text-[#94a3b8]">
                Click on a date to view scheduled posts
              </p>
            ) : selectedDatePosts.length === 0 ? (
              <div className="text-center py-6">
                <p className="font-retro text-lg text-[#94a3b8] mb-4">
                  No posts scheduled for this date
                </p>
                <Link
                  href="/compose"
                  className="inline-flex items-center gap-2 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                  style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
                >
                  <Plus className="w-4 h-4" />
                  Schedule Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDatePosts.map((scheduledPost) => (
                  <div
                    key={scheduledPost.id}
                    className="p-4 bg-[#1a1c2c] border-2 border-[#3a4466]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 font-retro text-lg text-[#0099db]">
                        <Clock className="w-4 h-4" />
                        {new Date(scheduledPost.scheduledFor).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                      <span
                        className={`font-retro text-base px-2 py-0.5 border-2 ${
                          scheduledPost.jobStatus === 'pending'
                            ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                            : scheduledPost.jobStatus === 'completed'
                            ? 'bg-[#63c74d] text-[#1a1c2c] border-[#f4f4f4]'
                            : 'bg-[#feae34] text-[#1a1c2c] border-[#f4f4f4]'
                        }`}
                      >
                        {scheduledPost.jobStatus}
                      </span>
                    </div>
                    <p className="font-retro text-base text-[#f4f4f4] line-clamp-3">
                      {scheduledPost.post.content.slice(0, 150)}
                      {scheduledPost.post.content.length > 150 ? '...' : ''}
                    </p>
                    {scheduledPost.jobStatus === 'pending' && (
                      <button
                        onClick={() => handleCancelPost(scheduledPost.id)}
                        className="mt-3 flex items-center gap-1 font-retro text-base text-[#e43b44] hover:text-[#f4f4f4] transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
