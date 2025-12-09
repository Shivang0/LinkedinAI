'use client';

import { useState, useRef, useEffect } from 'react';
import { List } from 'lucide-react';
import { BULLET_CATEGORIES, type BulletCategory } from '@/lib/unicode-formatter';

interface BulletPickerProps {
  onBulletSelect: (bullet: string) => void;
}

export function BulletPicker({ onBulletSelect }: BulletPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BulletCategory>('arrows');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleBulletClick = (bullet: string) => {
    onBulletSelect(bullet + ' ');
    setIsOpen(false);
  };

  const categories = Object.entries(BULLET_CATEGORIES) as [BulletCategory, (typeof BULLET_CATEGORIES)[BulletCategory]][];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 font-retro text-base border-2 px-3 py-2 transition-all ${
          isOpen
            ? 'bg-[#63c74d] text-[#0a0a0f] border-[#f4f4f4]'
            : 'bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-[#f4f4f4]'
        } hover:translate-x-[1px] hover:translate-y-[1px]`}
        style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
        title="Insert bullet point"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Bullets</span>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-[320px] bg-[#262b44] border-4 border-[#f4f4f4]"
          style={{ boxShadow: '6px 6px 0 #0a0a0f' }}
        >
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 p-2 border-b-2 border-[#3a4466]">
            {categories.map(([key, category]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`px-2 py-1 font-retro text-xs border transition-colors ${
                  activeCategory === key
                    ? 'bg-[#0099db] text-[#f4f4f4] border-[#f4f4f4]'
                    : 'bg-[#1a1c2c] text-[#94a3b8] border-[#3a4466] hover:border-[#f4f4f4]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Bullets grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1">
              {BULLET_CATEGORIES[activeCategory].bullets.map((bullet, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleBulletClick(bullet)}
                  className="w-9 h-9 flex items-center justify-center text-lg bg-[#1a1c2c] hover:bg-[#3a4466] border border-[#3a4466] hover:border-[#f4f4f4] transition-colors"
                  title={`Insert ${bullet}`}
                >
                  {bullet}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="px-3 pb-3">
            <p className="font-retro text-xs text-[#5a6080]">
              Click to insert at cursor position
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
