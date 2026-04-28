import { useQuery } from '@tanstack/react-query';
import { GlassCard, Button } from '@zhiyu/ui-kit';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/http.ts';

type SessionResp =
  | { authenticated: false }
  | { authenticated: true; user: { id: string; email: string; role: string; display_name: string | null } };

export function MePage() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: ['me-session'], queryFn: () => api<SessionResp>('/auth/session') });
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  if (q.isLoading) return <p>{t('common.loading')}</p>;
  if (!q.data || !q.data.authenticated) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto' }}>
        <GlassCard>
          <p data-testid="me-not-authed">{t('common.login')}</p>
          <Link to="/auth/login"><Button>{t('common.login')}</Button></Link>
        </GlassCard>
      </div>
    );
  }
  const u = q.data.user;
  return (
    <div style={{ maxWidth: 480, margin: '60px auto' }}>
      <GlassCard>
        <h3 style={{ marginTop: 0 }} data-testid="me-name">{u.display_name ?? u.email}</h3>
        <p style={{ color: 'var(--zy-fg-soft)' }}>{u.email}</p>
        <p>角色：<b>{u.role}</b></p>
        <Button variant="ghost" onClick={logout} data-testid="me-logout">{t('common.logout')}</Button>
      </GlassCard>
    </div>
  );
}
