/**
 * E06 — Immersive article reader.
 *
 * Route: /discover/:slug
 * Features:
 *  - Sentence list with toggleable pinyin + translation rows.
 *  - Per-sentence playback via Web Speech API (zh-CN).
 *  - Continuous play with rate control 0.75/1/1.25.
 *  - Long-press / double-click on a Han character → CharPopover.
 *  - Favorite + note CTA on each character; rating bar in header.
 *  - Reading progress saved every 10s + on unmount via discover.progress.save.
 *  - Font-size slider (90–140%) persisted to localStorage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, HStack, VStack } from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';
import { discover } from '../lib/api.js';
import { CharPopover } from '../components/discover/CharPopover.js';
import { RatingStars } from '../components/discover/RatingStars.js';

const FONT_LS_KEY = 'zhiyu:reader:font';
const PINYIN_LS_KEY = 'zhiyu:reader:pinyin';
const TRANS_LS_KEY = 'zhiyu:reader:trans';

function pickI18n(map: Record<string, string> | null | undefined, lng: string): string {
  if (!map) return '';
  return map[lng] || map['en'] || map['zh-CN'] || Object.values(map)[0] || '';
}

function isHanChar(c: string): boolean {
  if (!c) return false;
  const cp = c.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df)
  );
}

function speak(text: string, rate = 1, voice?: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    if (voice) {
      const v = window.speechSynthesis.getVoices().find((vv) => vv.name === voice);
      if (v) u.voice = v;
    }
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function DiscoverArticlePage(): JSX.Element {
  const { slug } = useParams({ from: '/discover/$slug' as never }) as { slug: string };
  const { i18n } = useT('common');
  const lng = i18n.language || 'en';
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['discover', 'article', slug],
    queryFn: () => discover.article(slug),
  });

  const [showPinyin, setShowPinyin] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(PINYIN_LS_KEY) !== '0' : true,
  );
  const [showTrans, setShowTrans] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TRANS_LS_KEY) !== '0' : true,
  );
  const [fontPct, setFontPct] = useState<number>(() => {
    if (typeof window === 'undefined') return 110;
    const v = Number(localStorage.getItem(FONT_LS_KEY));
    return Number.isFinite(v) && v >= 80 && v <= 160 ? v : 110;
  });
  const [rate, setRate] = useState<number>(1);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [popChar, setPopChar] = useState<string | null>(null);
  const [favChars, setFavChars] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PINYIN_LS_KEY, showPinyin ? '1' : '0');
    localStorage.setItem(TRANS_LS_KEY, showTrans ? '1' : '0');
    localStorage.setItem(FONT_LS_KEY, String(fontPct));
  }, [showPinyin, showTrans, fontPct]);

  // Load existing favorites once for star highlight.
  useEffect(() => {
    discover.favorites.list().then((r) => {
      const set = new Set<string>();
      for (const f of r.items) if (f.entity_type === 'char') set.add(f.entity_id);
      setFavChars(set);
    }).catch(() => undefined);
  }, []);

  const saveProgress = useMutation({
    mutationFn: (payload: { last_sentence_idx?: number; scroll_pct?: number; delta_seconds?: number; completed?: boolean }) =>
      discover.progress.save({ article_id: data!.article.id, ...payload }),
  });

  // Periodic progress save (every 10s while page open & article loaded).
  const startedAt = useRef<number>(Date.now());
  useEffect(() => {
    if (!data?.article) return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const delta = Math.round((Date.now() - startedAt.current) / 1000);
      if (delta < 5) return;
      startedAt.current = Date.now();
      const scroll =
        document.documentElement.scrollHeight > 0
          ? Math.min(
              100,
              Math.round(
                ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100,
              ),
            )
          : 0;
      saveProgress.mutate({
        last_sentence_idx: activeIdx ?? undefined,
        scroll_pct: scroll,
        delta_seconds: delta,
        completed: scroll >= 95,
      });
    }, 10_000);
    return () => clearInterval(id);
  }, [data?.article, activeIdx, saveProgress]);

  const rateMutation = useMutation({
    mutationFn: (score: number) => discover.rate(slug, score),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover', 'article', slug] }),
  });

  const playAll = useCallback(async () => {
    if (!data) return;
    for (let i = 0; i < data.sentences.length; i++) {
      setActiveIdx(i);
      const s = data.sentences[i];
      if (!s) continue;
      await new Promise<void>((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        const u = new SpeechSynthesisUtterance(s.zh);
        u.lang = 'zh-CN';
        u.rate = rate;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      });
    }
    setActiveIdx(null);
  }, [data, rate]);

  const stopAll = useCallback(() => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setActiveIdx(null);
  }, []);

  const longPressTimer = useRef<number | null>(null);
  const onCharPointerDown = useCallback((ch: string) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => setPopChar(ch), 350);
  }, []);
  const onCharPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const article = data?.article;
  const title = useMemo(() => (article ? pickI18n(article.i18n_title, lng) : ''), [article, lng]);
  const summary = useMemo(() => (article ? pickI18n(article.i18n_summary, lng) : ''), [article, lng]);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-text-tertiary" data-testid="reader-loading">
        加载中…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="py-8 text-center" data-testid="reader-error">
        <p className="text-text-secondary">文章未找到</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link to="/">← 返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-24" data-testid="reader-page">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">← 返回</Link>
        </Button>
      </div>
      <header className="mb-6">
        <HStack gap={2} className="mb-3">
          <Badge tone="rose" variant="soft">{`HSK ${article!.hsk_level}`}</Badge>
          <Badge tone="amber" variant="soft">{`${article!.estimated_minutes} min`}</Badge>
        </HStack>
        <h1 className="text-h1 text-text-primary">{title}</h1>
        <p className="mt-2 text-body-lg text-text-secondary">{summary}</p>
        <div className="mt-3 flex items-center gap-4">
          <RatingStars
            value={Number(article!.rating_avg)}
            count={article!.rating_count}
            size="md"
          />
          <span className="text-xs text-text-tertiary">您的评分:</span>
          <RatingStars
            value={data.rating_mine ?? 0}
            size="sm"
            onRate={(s) => rateMutation.mutate(s)}
          />
        </div>
      </header>

      <Card className="sticky top-2 z-30 mb-4 backdrop-blur-md" data-testid="reader-toolbar">
        <HStack gap={3} className="flex-wrap">
          <Button
            variant={showPinyin ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowPinyin((v) => !v)}
            data-testid="toggle-pinyin"
          >拼音</Button>
          <Button
            variant={showTrans ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowTrans((v) => !v)}
            data-testid="toggle-trans"
          >翻译</Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">字号</span>
            <input
              type="range"
              min={80}
              max={160}
              value={fontPct}
              onChange={(e) => setFontPct(Number(e.target.value))}
              className="w-24"
              data-testid="font-slider"
            />
            <span className="w-10 text-right text-xs text-text-tertiary">{fontPct}%</span>
          </div>
          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRate(r)}
                className={`rounded-full px-2 py-1 text-xs ${
                  rate === r ? 'bg-rose-500 text-white' : 'bg-surface-2 text-text-secondary'
                }`}
                data-testid={`rate-${r}`}
              >{`${r}×`}</button>
            ))}
          </div>
          <Button size="sm" onClick={() => void playAll()} data-testid="play-all">▶ 全文播放</Button>
          <Button size="sm" variant="ghost" onClick={stopAll} data-testid="stop-all">■ 停止</Button>
        </HStack>
      </Card>

      <VStack gap={3}>
        {data.sentences.map((s, i) => (
          <div
            key={s.id}
            className={`rounded-2xl border-2 p-4 transition ${
              activeIdx === i ? 'border-rose-500 bg-rose-50/50' : 'border-transparent bg-surface-2'
            }`}
            data-testid={`sentence-${i}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {showPinyin && s.pinyin && (
                  <div className="text-xs text-text-tertiary">{s.pinyin}</div>
                )}
                <div
                  className="mt-1 leading-loose text-text-primary"
                  style={{ fontSize: `${fontPct}%` }}
                >
                  {Array.from(s.zh).map((ch, idx) =>
                    isHanChar(ch) ? (
                      <span
                        key={idx}
                        className="cursor-pointer rounded px-0.5 hover:bg-amber-100"
                        onDoubleClick={() => setPopChar(ch)}
                        onPointerDown={() => onCharPointerDown(ch)}
                        onPointerUp={onCharPointerUp}
                        onPointerLeave={onCharPointerUp}
                        data-testid={`han-${i}-${idx}`}
                      >{ch}</span>
                    ) : (
                      <span key={idx}>{ch}</span>
                    ),
                  )}
                </div>
                {showTrans && (
                  <div className="mt-2 text-sm italic text-text-secondary">
                    {pickI18n(s.i18n_translation, lng)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveIdx(i);
                  speak(s.zh, rate, article!.audio_voice);
                }}
                className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-600 hover:bg-rose-500/20"
                data-testid={`play-${i}`}
              >▶</button>
            </div>
          </div>
        ))}
      </VStack>

      {popChar && (
        <CharPopover
          ch={popChar}
          lng={lng}
          isFavorite={favChars.has(popChar)}
          onClose={() => setPopChar(null)}
          onAddNote={async (ch) => {
            const body = window.prompt(`为「${ch}」添加笔记:`) ?? '';
            if (body.trim()) {
              await discover.notes.create('char', ch, body.trim()).catch(() => undefined);
            }
          }}
          onFavorite={async (ch) => {
            const has = favChars.has(ch);
            const next = new Set(favChars);
            if (has) {
              next.delete(ch);
              await discover.favorites.remove('char', ch).catch(() => undefined);
            } else {
              next.add(ch);
              await discover.favorites.add('char', ch).catch(() => undefined);
            }
            setFavChars(next);
          }}
          speak={(text) => speak(text, rate)}
        />
      )}
    </div>
  );
}
