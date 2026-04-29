import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, GlassCard, useToast } from '@zhiyu/ui-kit';
import { adminApi } from '../lib/http.ts';
import { ConfirmDialog } from './china/dialogs/ConfirmDialog.tsx';

type UserRow = { id: string; email: string; role: string; display_name: string | null; is_active: boolean };

export function UsersPage() {
  const toast = useToast();
  const [target, setTarget] = useState<UserRow | null>(null);
  const q = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi<{ items: UserRow[]; total: number }>('/users?page=1&size=50'),
  });
  async function doToggle() {
    if (!target) return;
    try {
      await adminApi(`/users/${target.id}/active`, { method: 'POST', body: JSON.stringify({ is_active: !target.is_active }) });
      toast.success(target.is_active ? '已禁用' : '已启用');
      setTarget(null);
      await q.refetch();
    } catch (e) {
      toast.error((e as Error).message || '操作失败');
      throw e;
    }
  }
  return (
    <div style={{ padding: 24 }}>
      <h2>用户管理</h2>
      <p style={{ color: 'var(--zy-fg-soft)', marginTop: -4, fontSize: 13 }}>
        仅展示普通用户（role=user），不包含任何管理员账号。
      </p>
      {q.isLoading && <p>加载中…</p>}
      {q.error && <p style={{ color: 'var(--zy-brand)' }}>{(q.error as Error).message}</p>}
      <div data-testid="users-table" style={{ display: 'grid', gap: 8 }}>
        {q.data?.items.length === 0 && !q.isLoading && (<GlassCard>暂无用户</GlassCard>)}
        {q.data?.items.map((u) => (
          <GlassCard key={u.id} data-testid={`user-row-${u.email}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.display_name ?? u.email}</div>
                <div style={{ color: 'var(--zy-fg-soft)', fontSize: 13, wordBreak: 'keep-all' }}>{u.email} · {u.role} · {u.is_active ? '启用' : '禁用'}</div>
              </div>
              <Button variant={u.is_active ? 'ghost' : 'primary'} data-testid={`toggle-${u.email}`} onClick={() => setTarget(u)}>
                {u.is_active ? '禁用' : '启用'}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {target && (
        <ConfirmDialog
          open
          testId="confirm-toggle-active"
          title={target.is_active ? '禁用用户' : '启用用户'}
          danger={target.is_active}
          okText={target.is_active ? '确认禁用' : '确认启用'}
          body={
            target.is_active
              ? <>确定要禁用 <b>{target.display_name ?? target.email}</b>？禁用后用户将无法登录。</>
              : <>确定要启用 <b>{target.display_name ?? target.email}</b>？启用后用户可正常登录。</>
          }
          onCancel={() => setTarget(null)}
          onConfirm={doToggle}
        />
      )}
    </div>
  );
}
