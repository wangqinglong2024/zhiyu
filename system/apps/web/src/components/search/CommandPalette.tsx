/**
 * ZY-05-04 — Global ⌘K command palette.
 *
 * - cmdk for keyboard nav + accessible dialog
 * - 200ms debounced fetch against /api/v1/search (with TanStack Query cache)
 * - Up to 5 results per type, grouped
 * - Recent searches (last 5) stored in localStorage
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useT } from '@zhiyu/i18n/client';
import { create } from '../../lib/store.js';
import { api } from '../../lib/api.js';

interface PaletteState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSearchPalette = create<PaletteState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));

interface SearchHit {
  id: string;
  type: 'course' | 'lesson' | 'article' | 'novel' | 'word' | 'setting';
  title: string;
  subtitle?: string;
  url: string;
}

interface SearchResp {
  q: string;
  total: number;
  results: Partial<Record<SearchHit['type'], SearchHit[]>>;
}

const RECENT_KEY = 'zhiyu:recent-search';
const MAX_RECENT = 5;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string): void {
  const trimmed = q.trim();
  if (!trimmed) return;
  const list = [trimmed, ...readRecent().filter((x) => x !== trimmed)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* swallow */
  }
}

const SUGGESTED: SearchHit[] = [
  { id: 'sg-discover', type: 'article', title: 'Discover · 发现', url: '/' },
  { id: 'sg-learn', type: 'course', title: 'Courses · 课程', url: '/learn' },
  { id: 'sg-play', type: 'setting', title: 'Games · 游戏', url: '/play' },
  { id: 'sg-me', type: 'setting', title: 'Profile · 我的', url: '/me' },
];

export function CommandPalette(): JSX.Element | null {
  const { t } = useT('common');
  const navigate = useNavigate();
  const isOpen = useSearchPalette((s) => s.isOpen);
  const close = useSearchPalette((s) => s.close);
  const [raw, setRaw] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState<string[]>(() => (typeof window === 'undefined' ? [] : readRecent()));

  // Global keyboard shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useSearchPalette.getState().toggle();
      }
      if (e.key === 'Escape') useSearchPalette.getState().close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Debounce input
  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw.trim()), 200);
    return () => clearTimeout(id);
  }, [raw]);

  // Auto-focus when opening
  useEffect(() => {
    if (isOpen) {
      setRaw('');
      setDebounced('');
      setRecent(readRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const { data, isFetching } = useQuery<SearchResp>({
    queryKey: ['search', debounced],
    enabled: isOpen && debounced.length > 0,
    queryFn: () => api<SearchResp>(`/api/v1/search?q=${encodeURIComponent(debounced)}`),
    staleTime: 60_000,
  });

  const grouped = useMemo(() => Object.entries(data?.results ?? {}), [data]);
  const hasResults = grouped.length > 0;

  if (!isOpen) return null;

  const onSelect = (url: string): void => {
    pushRecent(debounced);
    close();
    void navigate({ to: url });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.search')}
      data-testid="command-palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <Command
        label={t('nav.search')}
        className="glass-elevated w-full max-w-xl overflow-hidden rounded-2xl shadow-xl"
        shouldFilter={false}
      >
        <div className="flex items-center border-b border-glass-border px-4">
          <span className="text-text-tertiary">⌕</span>
          <Command.Input
            ref={inputRef}
            value={raw}
            onValueChange={setRaw}
            placeholder={t('search.placeholder')}
            data-testid="palette-input"
            className="w-full bg-transparent px-3 py-3 text-body outline-none"
          />
          {isFetching && <span className="text-micro text-text-tertiary">…</span>}
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {debounced.length === 0 && (
            <>
              {recent.length > 0 && (
                <Command.Group heading={t('search.recent')}>
                  {recent.map((q) => (
                    <Command.Item
                      key={q}
                      value={`recent-${q}`}
                      onSelect={() => setRaw(q)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-body data-[selected=true]:bg-rose-500/10 cursor-pointer"
                    >
                      <span className="text-text-tertiary">↺</span>
                      <span>{q}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              <Command.Group heading={t('nav.discover')}>
                {SUGGESTED.map((hit) => (
                  <Command.Item
                    key={hit.id}
                    value={hit.id}
                    onSelect={() => onSelect(hit.url)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-body data-[selected=true]:bg-rose-500/10 cursor-pointer"
                  >
                    <span>{hit.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          )}

          {debounced.length > 0 && !hasResults && !isFetching && (
            <div data-testid="palette-empty" className="px-4 py-12 text-center">
              <p className="text-body font-medium">{t('search.empty_title')}</p>
              <p className="mt-2 text-small text-text-secondary">{t('search.empty_desc')}</p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s.url)}
                    className="rounded-md border border-glass-border px-3 py-2 text-small hover:bg-white/40"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {grouped.map(([type, hits]) => (
            <Command.Group key={type} heading={t(`search.section.${type}`)}>
              {(hits ?? []).map((hit) => (
                <Command.Item
                  key={hit.id}
                  value={hit.id}
                  onSelect={() => onSelect(hit.url)}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-body data-[selected=true]:bg-rose-500/10 cursor-pointer"
                  data-testid={`palette-hit-${hit.id}`}
                >
                  <span>
                    <span className="font-medium">{hit.title}</span>
                    {hit.subtitle && (
                      <span className="ms-2 text-small text-text-tertiary">{hit.subtitle}</span>
                    )}
                  </span>
                  <span className="text-micro text-text-tertiary">↵</span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
