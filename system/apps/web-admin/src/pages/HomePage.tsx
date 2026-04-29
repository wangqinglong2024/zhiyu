import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, GlassCard } from '@zhiyu/ui-kit';
import { adminApi } from '../lib/http.ts';

export function HomePage() {
  const q = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => adminApi<{ authenticated: boolean; user?: { email: string; role: string } }>('/auth/session'),
  });
  if (q.isLoading) return <div style={{ padding: 24 }}><p>加载中…</p></div>;
  if (!q.data?.authenticated) {
    window.location.href = '/login';
    return null;
  }
  return (
    <div style={{ padding: 24 }}>
      <GlassCard data-testid="admin-dashboard">
        <h2 style={{ marginTop: 0 }}>欢迎，{q.data.user?.email}</h2>
        <p>角色：<b>{q.data.user?.role}</b></p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/china"><Button>发现中国</Button></Link>
          <Link to="/users"><Button>用户管理</Button></Link>
        </div>
      </GlassCard>
    </div>
  );
}
