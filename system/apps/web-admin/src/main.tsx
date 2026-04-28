import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TopNav, ThemeToggle, GlassCard, Button, Input, applyInitialTheme } from '@zhiyu/ui-kit';
import '@zhiyu/ui-kit/tokens.css';

applyInitialTheme();

const ADMIN_API = (import.meta.env.VITE_API_BASE_ADMIN as string) || 'http://localhost:9100/admin/v1';

async function adminApi<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(ADMIN_API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    credentials: 'include',
  });
  const json = (await res.json().catch(() => ({}))) as { code: number; data?: T; message?: string };
  if (!res.ok || (typeof json.code === 'number' && json.code !== 0)) throw new Error(json.message || `http_${res.status}`);
  return (json.data as T) ?? (undefined as never);
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav
        left={
          <>
            <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--zy-brand)' }} data-testid="brand-link">
              知语 · Admin
            </Link>
            <Link to="/users" data-testid="nav-users">用户管理</Link>
          </>
        }
        right={
          <>
            <ThemeToggle />
            <Button
              variant="ghost"
              data-testid="admin-logout"
              onClick={async () => {
                await adminApi('/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
            >
              退出
            </Button>
          </>
        }
      />
      <main className="zy-page" style={{ padding: 24 }}>{children}</main>
    </>
  );
}

function LoginPage() {
  const router = useRouter();
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
                await router.navigate({ to: '/' });
              } catch (e) { setErr((e as Error).message); }
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

function HomePage() {
  const q = useQuery({ queryKey: ['admin-session'], queryFn: () => adminApi<{ authenticated: boolean; user?: { email: string; role: string } }>('/auth/session') });
  if (q.isLoading) return <p>加载中…</p>;
  if (!q.data?.authenticated) {
    window.location.href = '/login';
    return null;
  }
  return (
    <GlassCard data-testid="admin-dashboard">
      <h2 style={{ marginTop: 0 }}>欢迎，{q.data.user?.email}</h2>
      <p>角色：<b>{q.data.user?.role}</b></p>
      <Link to="/users"><Button>用户管理</Button></Link>
    </GlassCard>
  );
}

type UserRow = { id: string; email: string; role: string; display_name: string | null; is_active: boolean };
function UsersPage() {
  const q = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi<{ items: UserRow[]; total: number }>('/users?page=1&size=50') });
  async function toggle(u: UserRow) {
    await adminApi(`/users/${u.id}/active`, { method: 'POST', body: JSON.stringify({ is_active: !u.is_active }) });
    await q.refetch();
  }
  return (
    <div>
      <h2>用户管理</h2>
      {q.isLoading && <p>加载中…</p>}
      {q.error && <p style={{ color: 'var(--zy-brand)' }}>{(q.error as Error).message}</p>}
      <div data-testid="users-table" style={{ display: 'grid', gap: 8 }}>
        {q.data?.items.map((u) => (
          <GlassCard key={u.id} data-testid={`user-row-${u.email}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{u.display_name ?? u.email}</div>
                <div style={{ color: 'var(--zy-fg-soft)', fontSize: 13 }}>{u.email} · {u.role} · {u.is_active ? '启用' : '禁用'}</div>
              </div>
              {u.role !== 'super_admin' && (
                <Button
                  variant={u.is_active ? 'ghost' : 'primary'}
                  data-testid={`toggle-${u.email}`}
                  onClick={() => toggle(u)}
                >
                  {u.is_active ? '禁用' : '启用'}
                </Button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({ component: () => <AdminLayout><Outlet /></AdminLayout> });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const usersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/users', component: UsersPage });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute, usersRoute, loginRoute]) });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const root = document.getElementById('root');
if (!root) throw new Error('#root not found');
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
