import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { TopNav, ThemeToggle } from '@zhiyu/ui-kit';
import { useTranslation } from 'react-i18next';
import { setLocale } from './i18n.ts';
import { LOCALES } from '@zhiyu/shared-config';

export function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <TopNav
        left={
          <>
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--zy-brand)' }} data-testid="brand-link">
              {t('common.app_name')}
            </Link>
            <Link to="/discover" data-testid="nav-discover">{t('nav.discover')}</Link>
            <Link to="/me" data-testid="nav-me">{t('nav.me')}</Link>
          </>
        }
        right={
          <>
            <select
              value={i18n.language}
              onChange={(e) => setLocale(e.target.value as never)}
              className="zy-input"
              style={{ width: 88, height: 36 }}
              data-testid="locale-switch"
            >
              {LOCALES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <ThemeToggle label={t('theme.toggle')} />
            <Link to="/auth/login" className="zy-btn zy-btn-primary" data-testid="cta-login">{t('common.login')}</Link>
          </>
        }
      />
      <main className="zy-page" style={{ padding: 24 }}>{children}</main>
    </>
  );
}
