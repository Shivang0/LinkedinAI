'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

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
          <div className="animate-spin w-8 h-8 border-4 border-linkedin-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-600 mt-1">
            {scheduledPosts.length} posts scheduled
          </p>
        </div>
        <Link href="/compose" className="btn-primary btn-md">
          Schedule New Post
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
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
                    className={`h-20 p-1 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-linkedin-blue bg-linkedin-blue/5'
                        : 'border-transparent hover:bg-gray-50'
                    } ${isToday(date) ? 'bg-blue-50' : ''}`}
                  >
                    <span
                      className={`text-sm ${
                        isToday(date)
                          ? 'font-bold text-linkedin-blue'
                          : 'text-gray-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {postsForDay.length > 0 && (
                      <div className="mt-1">
                        {postsForDay.slice(0, 2).map((post) => (
                          <div
                            key={post.id}
                            className={`text-xs px-1 py-0.5 rounded truncate mb-0.5 ${
                              post.jobStatus === 'pending'
                                ? 'bg-blue-100 text-blue-700'
                                : post.jobStatus === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {new Date(post.scheduledFor).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </div>
                        ))}
                        {postsForDay.length > 2 && (
                          <div className="text-xs text-gray-500">
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
          <div className="card sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a date'}
            </h3>

            {!selectedDate ? (
              <p className="text-sm text-gray-500">
                Click on a date to view scheduled posts
              </p>
            ) : selectedDatePosts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">
                  No posts scheduled for this date
                </p>
                <Link href="/compose" className="btn-secondary btn-sm">
                  Schedule Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDatePosts.map((scheduledPost) => (
                  <div
                    key={scheduledPost.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-linkedin-blue">
                        {new Date(scheduledPost.scheduledFor).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          scheduledPost.jobStatus === 'pending'
                            ? 'bg-blue-100 text-blue-700'
                            : scheduledPost.jobStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {scheduledPost.jobStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {scheduledPost.post.content.slice(0, 150)}
                      {scheduledPost.post.content.length > 150 ? '...' : ''}
                    </p>
                    {scheduledPost.jobStatus === 'pending' && (
                      <button
                        onClick={() => handleCancelPost(scheduledPost.id)}
                        className="mt-2 text-xs text-red-600 hover:underline"
                      >
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
