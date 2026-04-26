/**
 * Pinyin tone parsing + colour mapping (ZY-09-08)
 *
 * Tones encoded either via tone marks (mā, má, mǎ, mà) or trailing digit
 * (ma1, ma2, ma3, ma4, ma5/0). Returns the bare syllable + tone number 1..5.
 * 5 represents the neutral tone.
 */
export type Tone = 1 | 2 | 3 | 4 | 5;

const TONE_MAP: Record<string, [string, Tone]> = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['ü', 1], ǘ: ['ü', 2], ǚ: ['ü', 3], ǜ: ['ü', 4],
  ü: ['ü', 5],
};

export interface PinyinParse {
  /** Original (cleaned) syllable. */
  syllable: string;
  /** Bare letters (no tone marks/digits). */
  bare: string;
  tone: Tone;
}

export function parsePinyin(input: string): PinyinParse {
  const trimmed = input.trim().toLowerCase();
  // Trailing digit form ("ma3").
  const digitMatch = trimmed.match(/^([a-zü]+)([1-5])$/);
  if (digitMatch && digitMatch[1] && digitMatch[2]) {
    return {
      syllable: digitMatch[1],
      bare: digitMatch[1],
      tone: Number(digitMatch[2]) as Tone,
    };
  }
  // Tone-mark form.
  let tone: Tone = 5;
  let bare = '';
  for (const ch of trimmed) {
    const mapped = TONE_MAP[ch];
    if (mapped) {
      bare += mapped[0];
      if (mapped[1] !== 5) tone = mapped[1];
    } else {
      bare += ch;
    }
  }
  return { syllable: trimmed, bare, tone };
}

/** Tailwind / hex colors per tone — aligned with @zhiyu/ui token semantics. */
export const TONE_COLORS: Record<Tone, string> = {
  1: '#ef4444', // tone1 — red
  2: '#22c55e', // tone2 — green
  3: '#3b82f6', // tone3 — blue
  4: '#8b5cf6', // tone4 — violet
  5: '#6b7280', // neutral — gray
};

export function colorForPinyin(input: string): string {
  return TONE_COLORS[parsePinyin(input).tone];
}
