/**
 * ZY-05-03 — Bottom tab navigation. Mobile-only; hidden on `md` and up where
 * SideNav takes over. Uses TanStack Router `Link` so active state syncs with
 * URL and `aria-current="page"` is wired automatically.
 */
import { Link, useRouterState } from '@tanstack/react-router';
import { useT } from '@zhiyu/i18n/client';
import type { JSX } from 'react';

interface Tab {
  to: string;
  labelKey: string;
  icon: JSX.Element;
  match: (path: string) => boolean;
}

const Icon = ({ d }: { d: string }): JSX.Element => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const TABS: Tab[] = [
  {
    to: '/play',
    labelKey: 'nav.games',
    match: (p) => p.startsWith('/play'),
    icon: <Icon d="M6 11h4 M8 9v4 M15 12h.01 M17.5 10.5h.01 M16 16h0a4 4 0 0 0 4-4v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1a4 4 0 0 0 4 4" />,
  },
  {
    to: '/learn',
    labelKey: 'nav.courses',
    match: (p) => p.startsWith('/learn') || p.startsWith('/courses'),
    icon: <Icon d="M2 7l10-4 10 4-10 4-10-4z M6 9v5c0 1.5 3 3 6 3s6-1.5 6-3V9 M22 7v6" />,
  },
  {
    to: '/',
    labelKey: 'nav.discover',
    match: (p) => p === '/' || p.startsWith('/discover'),
    icon: <Icon d="M12 2v3 M12 19v3 M22 12h-3 M5 12H2 M19 5l-2 2 M7 17l-2 2 M19 19l-2-2 M7 7L5 5 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />,
  },
  {
    to: '/coin',
    labelKey: 'nav.coin',
    match: (p) => p.startsWith('/coin'),
    icon: <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v12 M9 9h4a2 2 0 0 1 0 4H9 M9 13h5a2 2 0 0 1 0 4H9" />,
  },
  {
    to: '/me',
    labelKey: 'nav.profile',
    match: (p) => p.startsWith('/me'),
    icon: <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />,
  },
];

export function BottomNav(): JSX.Element {
  const { t } = useT('common');
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label={t('nav.home')}
      className="glass-floating pointer-events-auto fixed inset-x-2 bottom-2 z-40 mx-auto flex max-w-xl items-stretch justify-between gap-1 rounded-full px-2 py-1 md:hidden"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
      data-testid="bottom-nav"
    >
      {TABS.map((tab) => {
        const active = tab.match(path);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            data-testid={`tab-${tab.labelKey.replace('nav.', '')}`}
            className={[
              'group flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 transition-all duration-200',
              active
                ? 'bg-rose-500/15 text-rose-600 scale-[1.02]'
                : 'text-text-secondary hover:bg-white/40',
            ].join(' ')}
          >
            <span className={active ? 'text-rose-600' : 'text-text-secondary'}>{tab.icon}</span>
            <span className="text-micro font-medium leading-none">{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
