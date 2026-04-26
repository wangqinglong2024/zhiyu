/**
 * Desktop side navigation (>= md). Mirrors the bottom-tab destinations.
 */
import { Link, useRouterState } from '@tanstack/react-router';
import { useT } from '@zhiyu/i18n/client';
import type { JSX } from 'react';

const ITEMS = [
  { to: '/', labelKey: 'nav.discover', match: (p: string) => p === '/' || p.startsWith('/discover') },
  { to: '/learn', labelKey: 'nav.courses', match: (p: string) => p.startsWith('/learn') || p.startsWith('/courses') },
  { to: '/play', labelKey: 'nav.games', match: (p: string) => p.startsWith('/play') },
  { to: '/coin', labelKey: 'nav.coin', match: (p: string) => p.startsWith('/coin') },
  { to: '/me', labelKey: 'nav.profile', match: (p: string) => p.startsWith('/me') },
];

export function SideNav(): JSX.Element {
  const { t } = useT('common');
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:block sticky top-20 h-fit w-48 shrink-0 self-start" aria-label="Primary">
      <nav className="glass-card flex flex-col gap-1 p-2">
        {ITEMS.map((item) => {
          const active = item.match(path);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={[
                'rounded-md px-3 py-2 text-body transition-colors',
                active ? 'bg-rose-500/15 text-rose-600 font-medium' : 'text-text-secondary hover:bg-white/40',
              ].join(' ')}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
