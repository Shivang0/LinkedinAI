'use client';

import { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: { native: string }) => {
    onEmojiSelect(emoji.native);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-retro text-base bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-2 border-[#f4f4f4] px-3 py-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
        style={{ boxShadow: '2px 2px 0 #0a0a0f' }}
        title="Add emoji"
      >
        <Smile className="w-4 h-4" />
        <span className="hidden sm:inline">Emoji</span>
      </button>

      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 z-50"
        >
          <div
            className="border-4 border-[#f4f4f4] bg-[#262b44]"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
              maxFrequentRows={2}
              perLine={8}
              emojiSize={24}
              emojiButtonSize={32}
              navPosition="bottom"
              set="native"
            />
          </div>
        </div>
      )}
    </div>
  );
}
