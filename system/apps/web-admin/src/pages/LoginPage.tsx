import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, GlassCard, Input } from '@zhiyu/ui-kit';
import { adminApi } from '../lib/http.ts';

export function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('admin@zhiyu.local');
  const [password, setPassword] = useState('Admin@123456');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="zy-page" style={{ padding: 24 }}>
      <div style={{ maxWidth: 420, margin: '80px auto' }}>
        <GlassCard>
          <h2 style={{ marginTop: 0 }}>管理员登录</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true); setErr(null);
              try {
                await adminApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
                // 登录成功后，刷新顶栏会话状态（Layout 用 admin-header-session）+ HomePage 用 admin-session
                await qc.invalidateQueries({ queryKey: ['admin-header-session'] });
                await qc.invalidateQueries({ queryKey: ['admin-session'] });
                await router.navigate({ to: '/' });
              } catch (e2) { setErr((e2 as Error).message); }
              finally { setBusy(false); }
            }}
            style={{ display: 'grid', gap: 12 }}
          >
            <Input data-testid="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {err && <div role="alert" style={{ color: 'var(--zy-brand)' }} data-testid="admin-login-error">{err}</div>}
            <Button type="submit" data-testid="admin-login-submit" disabled={busy}>{busy ? '登录中…' : '登录'}</Button>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
