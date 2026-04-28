import { useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { GlassCard, Button, Input } from '@zhiyu/ui-kit';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/http.ts';

export function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('admin@zhiyu.local');
  const [password, setPassword] = useState('Admin@123456');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await router.navigate({ to: '/me' });
    } catch (e) {
      setErr(t('auth.invalid_credentials'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <GlassCard>
        <h2 style={{ marginTop: 0 }}>{t('common.login')}</h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <Input
            data-testid="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email')}
            required
          />
          <Input
            data-testid="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password')}
            required
          />
          {err && <div role="alert" style={{ color: 'var(--zy-brand)' }} data-testid="login-error">{err}</div>}
          <Button type="submit" data-testid="login-submit" disabled={busy}>
            {busy ? t('common.loading') : t('common.login')}
          </Button>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--zy-fg-soft)' }}>
            <Link to="/auth/register" data-testid="to-register">{t('auth.no_account')} {t('common.register')}</Link>
            <span>{t('auth.forgot')}</span>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
