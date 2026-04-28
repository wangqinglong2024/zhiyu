import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TopNav, ThemeToggle } from '@zhiyu/ui-kit';
import { useTranslation } from 'react-i18next';
import { setLocale } from './i18n.ts';
import { LOCALES } from '@zhiyu/shared-config';
import { api } from '../lib/http.ts';

type SessionResp =
  | { authenticated: false }
  | { authenticated: true; user: { id: string; email: string; role: string; display_name: string | null } };

export function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const session = useQuery({
    queryKey: ['header-session'],
    queryFn: () => api<SessionResp>('/auth/session'),
    staleTime: 30_000,
  });
  const authed = session.data?.authenticated === true;
  const user = authed ? session.data.user : null;

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    qc.clear();
    window.location.href = '/';
  }

  return (
    <>
      <TopNav
        left={
          <>
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--zy-brand)' }} data-testid="brand-link">
              {t('common.app_name')}
            </Link>
            <Link to="/discover" data-testid="nav-discover">{t('nav.discover')}</Link>
            {authed && <Link to="/me" data-testid="nav-me">{t('nav.me')}</Link>}
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
            {authed && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  to="/me"
                  data-testid="header-user"
                  style={{ fontSize: 13, color: 'var(--zy-fg-soft)' }}
                >
                  {user.display_name ?? user.email}
                </Link>
                <button
                  type="button"
                  className="zy-btn"
                  onClick={logout}
                  data-testid="header-logout"
                  style={{ height: 36, padding: '0 12px' }}
                >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <Link to="/auth/login" className="zy-btn zy-btn-primary" data-testid="cta-login">
                {t('common.login')}
              </Link>
            )}
          </>
        }
      />
      <main className="zy-page" style={{ padding: 24 }}>{children}</main>
    </>
  );
}
