/**
 * Unicode Text Formatter for LinkedIn AI Generation
 *
 * Applies Unicode formatting to AI-generated content for visual appeal on LinkedIn.
 * LinkedIn doesn't support rich text, so we use Mathematical Alphanumeric Symbols.
 */

// Bold (Mathematical Sans-Serif Bold)
const BOLD_MAP: Record<string, string> = {
  A: '\u{1D5D4}', B: '\u{1D5D5}', C: '\u{1D5D6}', D: '\u{1D5D7}', E: '\u{1D5D8}',
  F: '\u{1D5D9}', G: '\u{1D5DA}', H: '\u{1D5DB}', I: '\u{1D5DC}', J: '\u{1D5DD}',
  K: '\u{1D5DE}', L: '\u{1D5DF}', M: '\u{1D5E0}', N: '\u{1D5E1}', O: '\u{1D5E2}',
  P: '\u{1D5E3}', Q: '\u{1D5E4}', R: '\u{1D5E5}', S: '\u{1D5E6}', T: '\u{1D5E7}',
  U: '\u{1D5E8}', V: '\u{1D5E9}', W: '\u{1D5EA}', X: '\u{1D5EB}', Y: '\u{1D5EC}',
  Z: '\u{1D5ED}',
  a: '\u{1D5EE}', b: '\u{1D5EF}', c: '\u{1D5F0}', d: '\u{1D5F1}', e: '\u{1D5F2}',
  f: '\u{1D5F3}', g: '\u{1D5F4}', h: '\u{1D5F5}', i: '\u{1D5F6}', j: '\u{1D5F7}',
  k: '\u{1D5F8}', l: '\u{1D5F9}', m: '\u{1D5FA}', n: '\u{1D5FB}', o: '\u{1D5FC}',
  p: '\u{1D5FD}', q: '\u{1D5FE}', r: '\u{1D5FF}', s: '\u{1D600}', t: '\u{1D601}',
  u: '\u{1D602}', v: '\u{1D603}', w: '\u{1D604}', x: '\u{1D605}', y: '\u{1D606}',
  z: '\u{1D607}',
  '0': '\u{1D7EC}', '1': '\u{1D7ED}', '2': '\u{1D7EE}', '3': '\u{1D7EF}', '4': '\u{1D7F0}',
  '5': '\u{1D7F1}', '6': '\u{1D7F2}', '7': '\u{1D7F3}', '8': '\u{1D7F4}', '9': '\u{1D7F5}',
};

/**
 * Convert text to bold Unicode characters
 */
function toBold(text: string): string {
  return text.split('').map(char => BOLD_MAP[char] || char).join('');
}

/**
 * Apply auto-formatting to AI-generated content
 * - Bolds the first line (hook)
 * - Converts **text** markers to bold Unicode
 * - Enhances bullet points with styled characters
 */
export function applyAutoFormat(content: string): string {
  if (!content) return content;

  const lines = content.split('\n');
  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Bold the first non-empty line (the hook)
    if (i === 0 || (formattedLines.every(l => l.trim() === '') && line.trim() !== '')) {
      if (line.trim() !== '') {
        line = toBold(line);
        formattedLines.push(line);
        continue;
      }
    }

    // Convert **text** markers to bold Unicode
    line = line.replace(/\*\*([^*]+)\*\*/g, (_, text) => toBold(text));

    // Enhance bullet points with styled characters
    // Convert common bullet patterns to styled Unicode bullets
    line = line
      .replace(/^(\s*)- /, '$1→ ')
      .replace(/^(\s*)\* /, '$1• ')
      .replace(/^(\s*)> /, '$1➤ ');

    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}
