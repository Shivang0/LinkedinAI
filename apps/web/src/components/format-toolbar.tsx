'use client';

import { useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, RemoveFormatting } from 'lucide-react';
import {
  toBold,
  toItalic,
  toBoldItalic,
  toUnderline,
  toStrikethrough,
  toPlainText,
} from '@/lib/unicode-formatter';

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onContentChange: (content: string) => void;
}

type FormatType = 'bold' | 'italic' | 'boldItalic' | 'underline' | 'strikethrough' | 'clear';

const formatFunctions: Record<FormatType, (text: string) => string> = {
  bold: toBold,
  italic: toItalic,
  boldItalic: toBoldItalic,
  underline: toUnderline,
  strikethrough: toStrikethrough,
  clear: toPlainText,
};

export function FormatToolbar({ textareaRef, content, onContentChange }: FormatToolbarProps) {
  const applyFormat = useCallback(
    (formatType: FormatType) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // If no selection, don't do anything (or could apply to whole text)
      if (start === end) {
        return;
      }

      const selectedText = content.slice(start, end);
      const formattedText = formatFunctions[formatType](selectedText);

      const newContent = content.slice(0, start) + formattedText + content.slice(end);
      onContentChange(newContent);

      // Restore selection after formatting
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start;
        textarea.selectionEnd = start + formattedText.length;
      }, 0);
    },
    [content, onContentChange, textareaRef]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
        }
      } else if (cmdKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'x':
            e.preventDefault();
            applyFormat('strikethrough');
            break;
          case 'b':
            e.preventDefault();
            applyFormat('boldItalic');
            break;
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [applyFormat, textareaRef]);

  const buttonClass =
    'flex items-center justify-center w-8 h-8 border-2 border-[#f4f4f4] bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] transition-all hover:translate-x-[1px] hover:translate-y-[1px]';
  const buttonStyle = { boxShadow: '2px 2px 0 #0a0a0f' };

  return (
    <div className="flex items-center gap-1 p-2 bg-[#1a1c2c] border-2 border-[#3a4466] mb-2">
      <button
        type="button"
        onClick={() => applyFormat('bold')}
        className={buttonClass}
        style={buttonStyle}
        title="Bold (Ctrl/Cmd+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => applyFormat('italic')}
        className={buttonClass}
        style={buttonStyle}
        title="Italic (Ctrl/Cmd+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => applyFormat('boldItalic')}
        className={buttonClass}
        style={buttonStyle}
        title="Bold Italic (Ctrl/Cmd+Shift+B)"
      >
        <span className="font-bold italic text-xs">BI</span>
      </button>

      <div className="w-px h-6 bg-[#3a4466] mx-1" />

      <button
        type="button"
        onClick={() => applyFormat('underline')}
        className={buttonClass}
        style={buttonStyle}
        title="Underline (Ctrl/Cmd+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => applyFormat('strikethrough')}
        className={buttonClass}
        style={buttonStyle}
        title="Strikethrough (Ctrl/Cmd+Shift+X)"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#3a4466] mx-1" />

      <button
        type="button"
        onClick={() => applyFormat('clear')}
        className={`${buttonClass} bg-[#e43b44] hover:bg-[#c42f37]`}
        style={buttonStyle}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      <span className="ml-auto font-retro text-xs text-[#5a6080]">Select text to format</span>
    </div>
  );
}
