/**
 * ZY-05-03 / ZY-05-04 / ZY-05-06 — Top app bar with brand, lang switcher,
 * search trigger (opens CommandPalette), notification bell (opens center)
 * and theme menu.
 */
import { Link } from '@tanstack/react-router';
import { Button, ThemeMenu } from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';
import type { JSX } from 'react';
import { LangSwitcher } from '../LangSwitcher.js';
import { useSearchPalette } from '../search/CommandPalette.js';
import { useNotificationCenter, useUnreadCount } from '../notifications/NotificationCenter.js';

const SearchIcon = (): JSX.Element => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const BellIcon = (): JSX.Element => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

const CoinIcon = (): JSX.Element => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9h4a2 2 0 0 1 0 4H9 M9 13h5a2 2 0 0 1 0 4H9 M12 6v12" />
  </svg>
);

export function TopBar(): JSX.Element {
  const { t } = useT('common');
  const openSearch = useSearchPalette((s) => s.open);
  const openNotif = useNotificationCenter((s) => s.open);
  const unread = useUnreadCount();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-overlay/60 border-b border-glass-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link to="/" className="text-title font-semibold tracking-tight text-text-primary shrink-0">
          <span className="bg-gradient-to-r from-rose-600 to-amber-500 bg-clip-text text-transparent">知语</span>{' '}
          {t('brand.name')}
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openSearch}
            data-testid="topbar-search"
            className="hidden sm:flex items-center gap-2 rounded-full border border-glass-border bg-white/40 px-3 py-1.5 text-small text-text-secondary hover:bg-white/60 transition-colors"
          >
            <SearchIcon />
            <span>{t('search.placeholder')}</span>
            <kbd className="ms-2 rounded bg-white/60 px-1.5 py-0.5 text-micro text-text-tertiary">{t('search.hint')}</kbd>
          </button>

          <button
            type="button"
            onClick={openSearch}
            aria-label={t('nav.search')}
            data-testid="topbar-search-icon"
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-white/40"
          >
            <SearchIcon />
          </button>

          <Link
            to="/coin"
            aria-label={t('nav.coin')}
            data-testid="topbar-coin"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-small font-medium text-amber-700"
          >
            <CoinIcon />
            <span>0</span>
          </Link>

          <button
            type="button"
            onClick={openNotif}
            aria-label={t('nav.notifications')}
            data-testid="topbar-bell"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-white/40"
          >
            <BellIcon />
            {unread > 0 && (
              <span
                data-testid="topbar-bell-badge"
                className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white"
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <LangSwitcher />
          <ThemeMenu />

          <Button asChild size="sm" variant="ghost" className="hidden lg:inline-flex">
            <a href="/signin">{t('nav.signin')}</a>
          </Button>
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <a href="/signup">{t('nav.signup')}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
