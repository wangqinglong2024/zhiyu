/**
 * E06 — Char popover.
 *
 * Hover (desktop) or long-press (touch) on a single Han character to fetch
 * pinyin/gloss/examples from /api/v1/discover/dict/:char.
 *
 * Uses anchor element + portal-less absolute positioning since we always
 * render inside the scrollable reader; the parent positions us with CSS.
 */
import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { discover } from '../../lib/api.js';

interface Props {
  ch: string;
  lng: string;
  onClose: () => void;
  onAddNote: (ch: string) => void;
  onFavorite: (ch: string) => void;
  isFavorite: boolean;
  speak: (text: string) => void;
}

function pickI18n(map: Record<string, string> | null | undefined, lng: string): string {
  if (!map) return '';
  return map[lng] || map['en'] || map['zh-CN'] || Object.values(map)[0] || '';
}

export function CharPopover(props: Props): JSX.Element {
  const { ch, lng, onClose, onAddNote, onFavorite, isFavorite, speak } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['discover', 'dict', ch],
    queryFn: () => discover.dict(ch).catch(() => null),
  });

  useEffect(() => {
    function handler(e: MouseEvent): void {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-border bg-surface-1 p-5 shadow-xl"
      data-testid="char-popover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-5xl font-bold text-rose-600">{ch}</div>
          {data?.entry?.pinyin && (
            <div className="mt-1 text-lg text-text-secondary">{data.entry.pinyin}</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => speak(ch)}
            className="rounded-full bg-rose-500 px-3 py-1 text-sm text-white"
            data-testid="char-speak"
          >▶ 播放</button>
          <button
            type="button"
            onClick={() => onFavorite(ch)}
            className={`rounded-full border px-3 py-1 text-sm ${
              isFavorite ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-border text-text-secondary'
            }`}
            data-testid="char-fav"
          >{isFavorite ? '★ 已收藏' : '☆ 收藏'}</button>
        </div>
      </div>

      {isLoading && <div className="mt-3 text-sm text-text-tertiary">加载中…</div>}
      {isError && <div className="mt-3 text-sm text-error-600">无法加载</div>}
      {data?.entry && (
        <>
          <div className="mt-3 text-sm leading-relaxed text-text-primary">
            {pickI18n(data.entry.i18n_gloss, lng) || '— 暂无释义 —'}
          </div>
          {Array.isArray(data.entry.examples) && data.entry.examples.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {data.entry.examples.slice(0, 3).map((ex, i) => (
                <div key={i} className="text-sm">
                  <div className="font-medium text-text-primary">{ex.zh}</div>
                  {ex.pinyin && <div className="text-xs text-text-tertiary">{ex.pinyin}</div>}
                  {ex.i18n && (
                    <div className="text-xs text-text-secondary">{pickI18n(ex.i18n, lng)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onAddNote(ch)}
          className="flex-1 rounded-full bg-amber-100 px-3 py-2 text-sm text-amber-700"
          data-testid="char-note"
        >+ 添加笔记</button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-surface-2 px-3 py-2 text-sm"
        >关闭</button>
      </div>
    </div>
  );
}
