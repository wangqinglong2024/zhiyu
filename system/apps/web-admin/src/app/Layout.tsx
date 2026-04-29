import type { ReactNode } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TopNav, ThemeToggle, Button } from '@zhiyu/ui-kit';
import { adminApi } from '../lib/http.ts';

type SessionResp =
  | { authenticated: false }
  | { authenticated: true; user: { email: string; role: string } };

export function AdminLayout({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const session = useQuery({
    queryKey: ['admin-header-session'],
    queryFn: () => adminApi<SessionResp>('/auth/session'),
    staleTime: 30_000,
    retry: false,
  });
  const authed = session.data?.authenticated === true;

  async function logout() {
    try { await adminApi('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    qc.clear();
    window.location.href = '/login';
  }
  async function login() {
    await router.navigate({ to: '/login' as never });
  }

  return (
    <>
      <TopNav
        left={
          <>
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--zy-brand)', whiteSpace: 'nowrap' }} data-testid="brand-link">
              知语 · Admin
            </Link>
            {authed && (
              <>
                <Link to="/china" className="zy-topnav-link" data-testid="nav-china">发现中国</Link>
                <Link to="/users" className="zy-topnav-link" data-testid="nav-users">用户管理</Link>
              </>
            )}
          </>
        }
        right={
          <>
            <ThemeToggle />
            {authed ? (
              <Button
                variant="ghost"
                data-testid="admin-logout"
                onClick={logout}
                style={{ whiteSpace: 'nowrap' }}
              >
                退出
              </Button>
            ) : (
              <Button
                data-testid="admin-login"
                onClick={login}
                style={{ whiteSpace: 'nowrap' }}
              >
                登录
              </Button>
            )}
          </>
        }
      />
      <main className="zy-page zy-admin-page" style={{ padding: 0 }}>{children}</main>
    </>
  );
}
