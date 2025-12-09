/**
 * Unicode Text Formatter for LinkedIn
 *
 * Converts regular text to Unicode Mathematical Alphanumeric Symbols
 * that appear as formatted text on LinkedIn (which doesn't support rich text).
 *
 * Note: Only works for A-Z, a-z, 0-9. Punctuation and special characters pass through unchanged.
 * Warning: These characters are not accessible to screen readers and not searchable.
 */

// Bold (Mathematical Sans-Serif Bold)
const BOLD_UPPER: Record<string, string> = {
  A: '\u{1D5D4}', B: '\u{1D5D5}', C: '\u{1D5D6}', D: '\u{1D5D7}', E: '\u{1D5D8}',
  F: '\u{1D5D9}', G: '\u{1D5DA}', H: '\u{1D5DB}', I: '\u{1D5DC}', J: '\u{1D5DD}',
  K: '\u{1D5DE}', L: '\u{1D5DF}', M: '\u{1D5E0}', N: '\u{1D5E1}', O: '\u{1D5E2}',
  P: '\u{1D5E3}', Q: '\u{1D5E4}', R: '\u{1D5E5}', S: '\u{1D5E6}', T: '\u{1D5E7}',
  U: '\u{1D5E8}', V: '\u{1D5E9}', W: '\u{1D5EA}', X: '\u{1D5EB}', Y: '\u{1D5EC}',
  Z: '\u{1D5ED}',
};

const BOLD_LOWER: Record<string, string> = {
  a: '\u{1D5EE}', b: '\u{1D5EF}', c: '\u{1D5F0}', d: '\u{1D5F1}', e: '\u{1D5F2}',
  f: '\u{1D5F3}', g: '\u{1D5F4}', h: '\u{1D5F5}', i: '\u{1D5F6}', j: '\u{1D5F7}',
  k: '\u{1D5F8}', l: '\u{1D5F9}', m: '\u{1D5FA}', n: '\u{1D5FB}', o: '\u{1D5FC}',
  p: '\u{1D5FD}', q: '\u{1D5FE}', r: '\u{1D5FF}', s: '\u{1D600}', t: '\u{1D601}',
  u: '\u{1D602}', v: '\u{1D603}', w: '\u{1D604}', x: '\u{1D605}', y: '\u{1D606}',
  z: '\u{1D607}',
};

const BOLD_DIGITS: Record<string, string> = {
  '0': '\u{1D7EC}', '1': '\u{1D7ED}', '2': '\u{1D7EE}', '3': '\u{1D7EF}', '4': '\u{1D7F0}',
  '5': '\u{1D7F1}', '6': '\u{1D7F2}', '7': '\u{1D7F3}', '8': '\u{1D7F4}', '9': '\u{1D7F5}',
};

// Italic (Mathematical Sans-Serif Italic)
const ITALIC_UPPER: Record<string, string> = {
  A: '\u{1D608}', B: '\u{1D609}', C: '\u{1D60A}', D: '\u{1D60B}', E: '\u{1D60C}',
  F: '\u{1D60D}', G: '\u{1D60E}', H: '\u{1D60F}', I: '\u{1D610}', J: '\u{1D611}',
  K: '\u{1D612}', L: '\u{1D613}', M: '\u{1D614}', N: '\u{1D615}', O: '\u{1D616}',
  P: '\u{1D617}', Q: '\u{1D618}', R: '\u{1D619}', S: '\u{1D61A}', T: '\u{1D61B}',
  U: '\u{1D61C}', V: '\u{1D61D}', W: '\u{1D61E}', X: '\u{1D61F}', Y: '\u{1D620}',
  Z: '\u{1D621}',
};

const ITALIC_LOWER: Record<string, string> = {
  a: '\u{1D622}', b: '\u{1D623}', c: '\u{1D624}', d: '\u{1D625}', e: '\u{1D626}',
  f: '\u{1D627}', g: '\u{1D628}', h: '\u{1D629}', i: '\u{1D62A}', j: '\u{1D62B}',
  k: '\u{1D62C}', l: '\u{1D62D}', m: '\u{1D62E}', n: '\u{1D62F}', o: '\u{1D630}',
  p: '\u{1D631}', q: '\u{1D632}', r: '\u{1D633}', s: '\u{1D634}', t: '\u{1D635}',
  u: '\u{1D636}', v: '\u{1D637}', w: '\u{1D638}', x: '\u{1D639}', y: '\u{1D63A}',
  z: '\u{1D63B}',
};

// Bold Italic (Mathematical Sans-Serif Bold Italic)
const BOLD_ITALIC_UPPER: Record<string, string> = {
  A: '\u{1D63C}', B: '\u{1D63D}', C: '\u{1D63E}', D: '\u{1D63F}', E: '\u{1D640}',
  F: '\u{1D641}', G: '\u{1D642}', H: '\u{1D643}', I: '\u{1D644}', J: '\u{1D645}',
  K: '\u{1D646}', L: '\u{1D647}', M: '\u{1D648}', N: '\u{1D649}', O: '\u{1D64A}',
  P: '\u{1D64B}', Q: '\u{1D64C}', R: '\u{1D64D}', S: '\u{1D64E}', T: '\u{1D64F}',
  U: '\u{1D650}', V: '\u{1D651}', W: '\u{1D652}', X: '\u{1D653}', Y: '\u{1D654}',
  Z: '\u{1D655}',
};

const BOLD_ITALIC_LOWER: Record<string, string> = {
  a: '\u{1D656}', b: '\u{1D657}', c: '\u{1D658}', d: '\u{1D659}', e: '\u{1D65A}',
  f: '\u{1D65B}', g: '\u{1D65C}', h: '\u{1D65D}', i: '\u{1D65E}', j: '\u{1D65F}',
  k: '\u{1D660}', l: '\u{1D661}', m: '\u{1D662}', n: '\u{1D663}', o: '\u{1D664}',
  p: '\u{1D665}', q: '\u{1D666}', r: '\u{1D667}', s: '\u{1D668}', t: '\u{1D669}',
  u: '\u{1D66A}', v: '\u{1D66B}', w: '\u{1D66C}', x: '\u{1D66D}', y: '\u{1D66E}',
  z: '\u{1D66F}',
};

// Combining characters
const COMBINING_UNDERLINE = '\u0332';
const COMBINING_STRIKETHROUGH = '\u0336';

// Create reverse maps for converting back to plain text
const createReverseMap = (maps: Record<string, string>[]): Record<string, string> => {
  const reverse: Record<string, string> = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      reverse[value] = key;
    }
  }
  return reverse;
};

const REVERSE_MAP = createReverseMap([
  BOLD_UPPER, BOLD_LOWER, BOLD_DIGITS,
  ITALIC_UPPER, ITALIC_LOWER,
  BOLD_ITALIC_UPPER, BOLD_ITALIC_LOWER,
]);

/**
 * Convert text to bold Unicode characters
 */
export function toBold(text: string): string {
  return text.split('').map(char => {
    if (BOLD_UPPER[char]) return BOLD_UPPER[char];
    if (BOLD_LOWER[char]) return BOLD_LOWER[char];
    if (BOLD_DIGITS[char]) return BOLD_DIGITS[char];
    return char;
  }).join('');
}

/**
 * Convert text to italic Unicode characters
 */
export function toItalic(text: string): string {
  return text.split('').map(char => {
    if (ITALIC_UPPER[char]) return ITALIC_UPPER[char];
    if (ITALIC_LOWER[char]) return ITALIC_LOWER[char];
    // Italic doesn't have digits, use regular
    return char;
  }).join('');
}

/**
 * Convert text to bold italic Unicode characters
 */
export function toBoldItalic(text: string): string {
  return text.split('').map(char => {
    if (BOLD_ITALIC_UPPER[char]) return BOLD_ITALIC_UPPER[char];
    if (BOLD_ITALIC_LOWER[char]) return BOLD_ITALIC_LOWER[char];
    // Bold italic doesn't have digits, use bold
    if (BOLD_DIGITS[char]) return BOLD_DIGITS[char];
    return char;
  }).join('');
}

/**
 * Add underline to text using combining character
 */
export function toUnderline(text: string): string {
  return text.split('').map(char => {
    // Don't add underline to whitespace
    if (/\s/.test(char)) return char;
    return char + COMBINING_UNDERLINE;
  }).join('');
}

/**
 * Add strikethrough to text using combining character
 */
export function toStrikethrough(text: string): string {
  return text.split('').map(char => {
    // Don't add strikethrough to whitespace
    if (/\s/.test(char)) return char;
    return char + COMBINING_STRIKETHROUGH;
  }).join('');
}

/**
 * Convert formatted text back to plain text
 */
export function toPlainText(text: string): string {
  // First remove combining characters
  let result = text.replace(new RegExp(`[${COMBINING_UNDERLINE}${COMBINING_STRIKETHROUGH}]`, 'g'), '');

  // Then convert Unicode characters back to regular
  // Use Array.from to properly handle surrogate pairs
  result = Array.from(result).map(char => {
    return REVERSE_MAP[char] || char;
  }).join('');

  return result;
}

/**
 * Check if text contains any formatted characters
 */
export function hasFormatting(text: string): boolean {
  // Check for combining characters
  if (text.includes(COMBINING_UNDERLINE) || text.includes(COMBINING_STRIKETHROUGH)) {
    return true;
  }

  // Check for Unicode formatted characters
  return Array.from(text).some(char => REVERSE_MAP[char] !== undefined);
}

/**
 * Bullet point categories for the picker
 */
export const BULLET_CATEGORIES = {
  arrows: {
    label: 'Arrows',
    bullets: ['→', '➜', '➤', '➔', '➢', '►', '▸', '▶', '↳', '⟶', '⇒', '⤷', '➡', '⮕'],
  },
  checkmarks: {
    label: 'Checkmarks',
    bullets: ['✓', '✔', '☑', '✅', '✗', '✘', '❌', '☐', '☒'],
  },
  stars: {
    label: 'Stars & Shapes',
    bullets: ['⭐', '★', '☆', '✦', '✧', '◆', '◇', '◈', '❖'],
  },
  shapes: {
    label: 'Bullets',
    bullets: ['•', '◦', '●', '○', '◉', '◎', '■', '□', '▪', '▫', '▬', '▮'],
  },
  numbers: {
    label: 'Numbers',
    bullets: ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'],
  },
  numbersEmoji: {
    label: 'Number Emojis',
    bullets: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
  },
  professional: {
    label: 'Professional',
    bullets: ['💡', '📌', '📍', '🎯', '💼', '📢', '📈', '🔑', '⚡', '🔥', '💎', '🚀'],
  },
  special: {
    label: 'Special',
    bullets: ['♦', '♠', '♣', '♥', '✿', '❀', '☀', '☁', '⚙', '⚠', '✉', '☎'],
  },
} as const;

export type BulletCategory = keyof typeof BULLET_CATEGORIES;
