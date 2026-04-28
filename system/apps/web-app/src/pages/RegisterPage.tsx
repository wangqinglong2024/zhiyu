import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { GlassCard, Button, Input } from '@zhiyu/ui-kit';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/http.ts';

export function RegisterPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, display_name: name || undefined }),
      });
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <GlassCard>
        <h2 style={{ marginTop: 0 }}>{t('common.register')}</h2>
        {done ? (
          <p data-testid="register-done">{t('auth.register_email_sent')}</p>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <Input data-testid="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.email')} required />
            <Input data-testid="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.password')} required />
            <Input data-testid="register-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.display_name')} />
            {err && <div role="alert" style={{ color: 'var(--zy-brand)' }} data-testid="register-error">{err}</div>}
            <Button type="submit" data-testid="register-submit" disabled={busy}>
              {busy ? t('common.loading') : t('common.register')}
            </Button>
            <div style={{ fontSize: 13, color: 'var(--zy-fg-soft)' }}>
              <Link to="/auth/login">{t('auth.have_account')} {t('common.login')}</Link>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
