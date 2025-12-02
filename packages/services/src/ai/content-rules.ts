/**
 * Content rules for natural AI-generated LinkedIn posts
 * Based on natural-content-generation-guide.md
 */

// Words that trigger AI detection - never use these
export const BANNED_WORDS = [
  'delve',
  'delve into',
  'dive deep',
  'unpack',
  'leverage',
  'leveraging',
  'game-changer',
  'game changer',
  'revolutionary',
  'revolutionize',
  'revolutionizing',
  'transform',
  'transformation',
  'transformative',
  'synergy',
  'disrupt',
  'disrupting',
  'paradigm',
  'paradigm shift',
  'cutting-edge',
  'cutting edge',
  'best-in-class',
  'thought leader',
  'move the needle',
  'circle back',
  'low-hanging fruit',
  'deep dive',
  'value-add',
  'value add',
  'bandwidth',
  'robust',
  'scalable',
  'holistic',
  'ecosystem',
  'empower',
  'empowering',
  'unprecedented',
  'innovative',
  'in today\'s world',
  'in today\'s rapidly evolving',
  'in conclusion',
  'furthermore',
  'it\'s worth noting that',
  'at the end of the day',
  'needless to say',
  'all in all',
  'it\'s imperative',
  'it goes without saying',
];

// Patterns to detect and remove
export const BANNED_PATTERNS = [
  /—/g,           // em-dash
  /\u2014/g,      // unicode em-dash
  /\u2013/g,      // en-dash
  /!{2,}/g,       // multiple exclamation marks
  /\.{4,}/g,      // excessive ellipsis
];

// Word replacements for more natural language
export const WORD_REPLACEMENTS: Record<string, string> = {
  'delve': 'explore',
  'delve into': 'look at',
  'leverage': 'use',
  'leveraging': 'using',
  'transform': 'change',
  'transformation': 'change',
  'furthermore': 'also',
  'robust': 'strong',
  'scalable': 'flexible',
  'empower': 'enable',
  'empowering': 'enabling',
  'unprecedented': 'unusual',
  'innovative': 'new',
  'synergy': 'collaboration',
  'paradigm': 'approach',
  'holistic': 'complete',
  'ecosystem': 'system',
};

export interface ContentValidationResult {
  isValid: boolean;
  issues: ContentIssue[];
  cleaned: string;
}

export interface ContentIssue {
  type: 'banned_word' | 'banned_pattern' | 'length' | 'formatting';
  message: string;
  position?: number;
  suggestion?: string;
}

/**
 * Validates and cleans content to remove AI-detectable patterns
 */
export function validateAndCleanContent(content: string): ContentValidationResult {
  const issues: ContentIssue[] = [];
  let cleaned = content;

  // Check for banned words and replace them
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    if (regex.test(cleaned)) {
      const replacement = WORD_REPLACEMENTS[word.toLowerCase()];
      issues.push({
        type: 'banned_word',
        message: `Contains AI-detectable word: "${word}"`,
        suggestion: replacement ? `Replace with "${replacement}"` : 'Remove or rephrase',
      });

      if (replacement) {
        cleaned = cleaned.replace(regex, replacement);
      }
    }
  }

  // Check for banned patterns
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(cleaned)) {
      issues.push({
        type: 'banned_pattern',
        message: 'Contains AI-detectable pattern (em-dash or excessive punctuation)',
      });

      // Replace em-dashes with comma or period
      if (pattern.source.includes('2014') || pattern.source.includes('—')) {
        cleaned = cleaned.replace(pattern, ', ');
      } else {
        cleaned = cleaned.replace(pattern, '');
      }
    }
  }

  // Check for generic list patterns
  const genericListPatterns = [
    /here(?:'s| is| are) (?:\d+|why|how)/gi,
    /^(?:\d+\.|\d+\))\s/gm,
  ];

  for (const pattern of genericListPatterns) {
    if (pattern.test(cleaned)) {
      issues.push({
        type: 'formatting',
        message: 'Contains generic list pattern that may seem AI-generated',
        suggestion: 'Add personal context before lists',
      });
    }
  }

  // Check length
  if (cleaned.length > 3000) {
    issues.push({
      type: 'length',
      message: `Content exceeds LinkedIn's 3000 character limit (${cleaned.length} chars)`,
    });
  }

  return {
    isValid: issues.filter(i => i.type === 'banned_word' || i.type === 'banned_pattern').length === 0,
    issues,
    cleaned: cleaned.trim(),
  };
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if content has good sentence variety (perplexity)
 */
export function checkSentenceVariety(content: string): {
  score: number;
  feedback: string;
} {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length === 0) {
    return { score: 0, feedback: 'No sentences found' };
  }

  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Good variety means high standard deviation
  const varietyScore = Math.min(100, (stdDev / avgLength) * 100);

  let feedback = '';
  if (varietyScore < 20) {
    feedback = 'Sentences are too uniform in length. Mix short punchy sentences with longer ones.';
  } else if (varietyScore < 40) {
    feedback = 'Decent variety. Consider adding more contrast between short and long sentences.';
  } else {
    feedback = 'Good sentence variety!';
  }

  return { score: varietyScore, feedback };
}
