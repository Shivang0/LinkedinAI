'use client';

import { TrendingUp, Clock } from 'lucide-react';

export default function EngagementPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div
        className="bg-[#262b44] border-4 border-[#f4f4f4] p-12 text-center"
        style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <TrendingUp className="w-16 h-16 text-[#feae34]" />
            <Clock className="w-8 h-8 text-[#0099db] absolute -bottom-1 -right-1" />
          </div>
        </div>

        <h1 className="font-pixel text-base md:text-lg text-[#feae34] text-shadow-pixel mb-4">
          COMING SOON
        </h1>

        <h2 className="font-pixel text-sm text-[#63c74d] text-shadow-pixel mb-6">
          POST ENGAGEMENT ANALYTICS
        </h2>

        <p className="font-retro text-xl text-[#f4f4f4] mb-4 max-w-lg mx-auto">
          Track your LinkedIn post performance with detailed engagement metrics
        </p>

        <div className="font-retro text-lg text-[#94a3b8] space-y-2 mb-8">
          <p>Likes, comments, and shares tracking</p>
          <p>Impressions and click analytics</p>
          <p>Historical performance trends</p>
        </div>

        <div className="inline-block bg-[#1a1c2c] border-2 border-[#3a4466] px-6 py-3">
          <p className="font-retro text-base text-[#5a6080]">
            This feature requires LinkedIn Marketing API access.
            <br />
            We&apos;re working on getting approval!
          </p>
        </div>
      </div>
    </div>
  );
}
