/**
 * ZY-05-06 — Notification center.
 *
 * - Subscribes to Supabase realtime channel `notif:user:<uid>` once auth user
 *   is known (re-subscribes on auth change).
 * - Maintains in-memory list synced with `/api/v1/notifications`.
 * - Sheet-style drawer with type filter + mark-all-read.
 * - Falls back gracefully when Supabase env / auth missing (just shows list).
 */
import { useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import { useT } from '@zhiyu/i18n/client';
import { useNavigate } from '@tanstack/react-router';
import { create } from '../../lib/store.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import { getSupabase } from '../../lib/supabase.js';

export interface Notification {
  id: string;
  user_id: string;
  type: 'system' | 'learning' | 'order' | 'cs' | 'referral';
  title_key: string;
  body_key: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

interface State {
  isOpen: boolean;
  loading: boolean;
  items: Notification[];
  unread: number;
  filter: 'all' | Notification['type'];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setFilter: (f: State['filter']) => void;
  setItems: (items: Notification[], unread?: number) => void;
  prepend: (n: Notification) => void;
  markRead: (ids?: string[], all?: boolean) => void;
}

export const useNotificationCenter = create<State>((set, get) => ({
  isOpen: false,
  loading: false,
  items: [],
  unread: 0,
  filter: 'all',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
  setFilter: (filter) => set({ filter }),
  setItems: (items, unread) => set({ items, unread: unread ?? items.filter((i) => !i.read_at).length }),
  prepend: (n) =>
    set((s) => ({
      items: [n, ...s.items.filter((i) => i.id !== n.id)],
      unread: s.unread + (n.read_at ? 0 : 1),
    })),
  markRead: (ids, all) =>
    set((s) => {
      const idSet = ids ? new Set(ids) : null;
      const items = s.items.map((i) =>
        all || (idSet && idSet.has(i.id)) ? { ...i, read_at: i.read_at ?? new Date().toISOString() } : i,
      );
      return { items, unread: items.filter((i) => !i.read_at).length };
    }),
}));

export function useUnreadCount(): number {
  return useNotificationCenter((s) => s.unread);
}

const FILTERS: Array<{ key: State['filter']; labelKey: string }> = [
  { key: 'all', labelKey: 'notifications.filter_all' },
  { key: 'system', labelKey: 'notifications.filter_system' },
  { key: 'learning', labelKey: 'notifications.filter_learning' },
  { key: 'order', labelKey: 'notifications.filter_order' },
  { key: 'cs', labelKey: 'notifications.filter_cs' },
];

export function NotificationCenter(): JSX.Element | null {
  const { t } = useT('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOpen = useNotificationCenter((s) => s.isOpen);
  const close = useNotificationCenter((s) => s.close);
  const items = useNotificationCenter((s) => s.items);
  const filter = useNotificationCenter((s) => s.filter);
  const setFilter = useNotificationCenter((s) => s.setFilter);
  const setItems = useNotificationCenter((s) => s.setItems);
  const prepend = useNotificationCenter((s) => s.prepend);
  const markRead = useNotificationCenter((s) => s.markRead);

  // Initial fetch + realtime channel.
  useEffect(() => {
    if (!user) {
      setItems([], 0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await api<{ items: Notification[]; unread_count: number }>(
          '/api/v1/notifications?limit=30',
        );
        if (!cancelled) setItems(r.items, r.unread_count);
      } catch {
        // anonymous / offline — ignore
      }
    })();
    const supa = getSupabase();
    if (!supa) return () => {
      cancelled = true;
    };
    const channel = supa.channel(`notif:user:${user.id}`);
    channel.on('broadcast', { event: 'notification' }, (p) => {
      const n = p.payload as Notification;
      prepend({ ...n, user_id: user.id, read_at: null });
    });
    void channel.subscribe();
    return () => {
      cancelled = true;
      void supa.removeChannel(channel);
    };
  }, [user, setItems, prepend]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.type === filter)),
    [items, filter],
  );

  if (!isOpen) return null;

  const handleMarkAll = async (): Promise<void> => {
    markRead(undefined, true);
    try {
      await api('/api/v1/notifications/read', { method: 'POST', body: JSON.stringify({ all: true }) });
    } catch {
      /* optimistic */
    }
  };

  const handleClick = async (n: Notification): Promise<void> => {
    markRead([n.id]);
    try {
      await api('/api/v1/notifications/read', { method: 'POST', body: JSON.stringify({ ids: [n.id] }) });
    } catch {
      /* optimistic */
    }
    const url = (n.data?.url as string) ?? null;
    if (url) {
      close();
      void navigate({ to: url });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('notifications.title')}
      data-testid="notif-center"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside
        className="glass-elevated absolute right-0 top-0 flex h-full w-full max-w-md flex-col rounded-none border-l border-glass-border-strong sm:right-2 sm:top-2 sm:h-[calc(100%-1rem)] sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-glass-border px-4 py-3">
          <h2 className="text-h3">{t('notifications.title')}</h2>
          <button
            type="button"
            onClick={close}
            aria-label={t('actions.close')}
            className="rounded-md px-2 py-1 text-text-secondary hover:bg-white/40"
          >
            ✕
          </button>
        </header>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-glass-border px-4 py-2 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              data-testid={`notif-filter-${f.key}`}
              className={[
                'shrink-0 rounded-full px-3 py-1 text-small transition-colors',
                f.key === filter ? 'bg-rose-500/15 text-rose-700 font-medium' : 'text-text-secondary hover:bg-white/40',
              ].join(' ')}
            >
              {t(f.labelKey)}
            </button>
          ))}
          <span className="ms-auto" />
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            data-testid="notif-mark-all"
            className="shrink-0 rounded-md px-2 py-1 text-small text-text-secondary hover:bg-white/40"
          >
            {t('notifications.mark_all_read')}
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto" data-testid="notif-list">
          {filtered.length === 0 && (
            <li className="px-6 py-16 text-center text-text-secondary">{t('notifications.empty')}</li>
          )}
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void handleClick(n)}
                data-testid={`notif-item-${n.id}`}
                className={[
                  'flex w-full items-start gap-3 border-b border-glass-border px-4 py-3 text-start transition-colors hover:bg-white/40',
                  n.read_at ? 'opacity-70' : '',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'mt-1 inline-block h-2 w-2 shrink-0 rounded-full',
                    n.read_at ? 'bg-text-disabled' : 'bg-rose-500',
                  ].join(' ')}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-medium">{t(n.title_key, n.data as Record<string, unknown>)}</span>
                  {n.body_key && (
                    <span className="block text-small text-text-secondary">
                      {t(n.body_key, n.data as Record<string, unknown>)}
                    </span>
                  )}
                  <span className="mt-1 block text-micro text-text-tertiary">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
