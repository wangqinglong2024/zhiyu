/**
 * PinyinRenderer / Hanzi-with-pinyin layout helpers (ZY-09-08)
 *
 * Pure layout — no Pixi dependency. Returns the geometric placement so
 * either Pixi (BitmapText / Text) or React-DOM consumers can draw.
 */
import { TONE_COLORS, parsePinyin } from './pinyin.js';
import type { Tone } from './pinyin.js';

export interface HanziLayoutInput {
  char: string;
  pinyin: string;
  /** Total cell size; pinyin sits in the top quarter, hanzi in lower 3/4. */
  cellSize: number;
}

export interface HanziLayout {
  char: string;
  pinyin: string;
  pinyinTone: Tone;
  pinyinColor: string;
  /** Hanzi font size (px). */
  hanziFontSize: number;
  /** Pinyin font size (px). */
  pinyinFontSize: number;
  /** Center coordinates relative to the cell origin. */
  hanziX: number;
  hanziY: number;
  pinyinX: number;
  pinyinY: number;
}

/**
 * Spec: pinyin in top 25% of cell, hanzi centred in remaining 75%.
 * Defaults: pinyin font = 0.30 × cell, hanzi font = 0.66 × cell.
 */
export function layoutHanziWithPinyin(input: HanziLayoutInput): HanziLayout {
  const cell = Math.max(8, input.cellSize);
  const pinyinFontSize = Math.round(cell * 0.3);
  const hanziFontSize = Math.round(cell * 0.66);
  const parsed = parsePinyin(input.pinyin);
  return {
    char: input.char,
    pinyin: parsed.syllable,
    pinyinTone: parsed.tone,
    pinyinColor: TONE_COLORS[parsed.tone],
    hanziFontSize,
    pinyinFontSize,
    pinyinX: cell / 2,
    pinyinY: cell * 0.18,
    hanziX: cell / 2,
    hanziY: cell * 0.6,
  };
}

/** Batch layout. Used to verify the AC `500 字 ≤ 100ms`. */
export function layoutBatch(items: HanziLayoutInput[]): HanziLayout[] {
  const out: HanziLayout[] = new Array(items.length);
  for (let i = 0; i < items.length; i += 1) {
    out[i] = layoutHanziWithPinyin(items[i]!);
  }
  return out;
}
