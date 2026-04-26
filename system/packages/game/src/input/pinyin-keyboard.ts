/**
 * On-screen Pinyin keyboard helper (ZY-09-05 MVP)
 *
 * Headless model — render in your engine UI layer using the returned key map.
 * This module avoids any DOM dependency so we can render in either Pixi or
 * React-DOM contexts.
 */
export interface PinyinKey {
  glyph: string;
  /** Hanyu pinyin token, sometimes initial (zh, ch, sh) sometimes single. */
  token: string;
  group: 'initial' | 'final' | 'tone' | 'control';
}

export const PINYIN_INITIALS: PinyinKey[] = [
  ...['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 's', 'y', 'w'].map((t) => ({
    glyph: t,
    token: t,
    group: 'initial' as const,
  })),
  { glyph: 'zh', token: 'zh', group: 'initial' },
  { glyph: 'ch', token: 'ch', group: 'initial' },
  { glyph: 'sh', token: 'sh', group: 'initial' },
];

export const PINYIN_FINALS: PinyinKey[] = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong'].map(
  (t) => ({ glyph: t, token: t, group: 'final' as const }),
);

export const PINYIN_TONES: PinyinKey[] = [
  { glyph: '¯', token: '1', group: 'tone' },
  { glyph: '́', token: '2', group: 'tone' },
  { glyph: '̌', token: '3', group: 'tone' },
  { glyph: '̀', token: '4', group: 'tone' },
  { glyph: '·', token: '5', group: 'tone' },
];

export const PINYIN_CONTROLS: PinyinKey[] = [
  { glyph: '⌫', token: 'bs', group: 'control' },
  { glyph: '⏎', token: 'enter', group: 'control' },
  { glyph: '␣', token: 'space', group: 'control' },
];

/**
 * Pure controller for the on-screen keyboard. Apps subscribe to `onSubmit`
 * to receive composed pinyin syllables and `onInput` for live preview.
 */
export class PinyinKeyboardController {
  private buffer: string[] = [];
  private readonly inputListeners = new Set<(value: string) => void>();
  private readonly submitListeners = new Set<(value: string) => void>();

  get value(): string {
    return this.buffer.join('');
  }

  press(key: PinyinKey): void {
    if (key.group === 'control') {
      if (key.token === 'bs') this.buffer.pop();
      else if (key.token === 'enter') return this._submit();
      else if (key.token === 'space') this.buffer.push(' ');
    } else {
      this.buffer.push(key.token);
    }
    this._emitInput();
  }

  clear(): void {
    this.buffer = [];
    this._emitInput();
  }

  onInput(cb: (value: string) => void): () => void {
    this.inputListeners.add(cb);
    return () => this.inputListeners.delete(cb);
  }

  onSubmit(cb: (value: string) => void): () => void {
    this.submitListeners.add(cb);
    return () => this.submitListeners.delete(cb);
  }

  private _submit(): void {
    const v = this.value;
    for (const cb of this.submitListeners) cb(v);
    this.buffer = [];
    this._emitInput();
  }

  private _emitInput(): void {
    const v = this.value;
    for (const cb of this.inputListeners) cb(v);
  }
}
