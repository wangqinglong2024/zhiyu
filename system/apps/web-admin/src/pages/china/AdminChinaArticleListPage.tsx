import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, GlassCard, Input, Pagination, Select, SkeletonCard, Tag, useToast } from '@zhiyu/ui-kit';
import { adminApi } from '../../lib/http.ts';
import type { AdminArticle, AdminCategory, AdminListArticles } from '../../lib/types.ts';
import { NewArticleModal } from './dialogs/NewArticleModal.tsx';
import { ConfirmDialog } from './dialogs/ConfirmDialog.tsx';

type Status = 'all' | 'draft' | 'published';

export function AdminChinaArticleListPage() {
  const params = useParams({ strict: false }) as { code?: string };
  const code = params.code ?? '01';
  const nav = useNavigate();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<Status>('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'publish' | 'unpublish' | 'delete'; row: AdminArticle } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => { setPage(1); }, [debouncedQ, status, code]);

  const cats = useQuery({
    queryKey: ['admin-china-categories'],
    queryFn: () => adminApi<{ items: AdminCategory[] }>('/china/categories'),
    staleTime: 60_000,
  });
  const cat = useMemo(() => cats.data?.items.find((c) => c.code === code), [cats.data, code]);

  const list = useQuery({
    queryKey: ['admin-china-articles', code, page, pageSize, status, debouncedQ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('category_code', code);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (status !== 'all') params.set('status', status);
      if (debouncedQ) params.set('q', debouncedQ);
      return adminApi<AdminListArticles>(`/china/articles?${params.toString()}`);
    },
    enabled: !!code,
  });

  async function doAction() {
    if (!confirm) return;
    const { kind, row } = confirm;
    if (kind === 'publish') {
      await adminApi(`/china/articles/${row.id}/publish`, { method: 'POST' });
      toast.success('已发布');
    } else if (kind === 'unpublish') {
      await adminApi(`/china/articles/${row.id}/unpublish`, { method: 'POST' });
      toast.success('已下架');
    } else {
      await adminApi(`/china/articles/${row.id}`, { method: 'DELETE' });
      toast.success('已删除');
    }
    setConfirm(null);
    await list.refetch();
    await cats.refetch();
  }

  return (
    <div style={{ padding: 24 }} data-testid="admin-article-list">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button variant="ghost" data-testid="back-to-cats" onClick={() => nav({ to: '/china' })}>← 返回类目</Button>
        <h2 style={{ margin: 0, fontSize: 20, whiteSpace: 'nowrap' }}>
          {cat ? `#${cat.code} ${cat.name_i18n.zh}` : `类目 ${code}`}
        </h2>
        {cat && (
          <span style={{ color: 'var(--zy-fg-soft)', fontSize: 13 }}>
            总 {cat.article_count_total} · 已发布 {cat.article_count_published} · 草稿 {cat.article_count_draft}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <Input
          data-testid="article-search"
          placeholder="🔍 搜索：标题 / 句子内容"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 280, flex: '1 1 280px' }}
        />
        <Select data-testid="status-filter" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </Select>
        <Button data-testid="new-article-btn" onClick={() => setShowNew(true)}>+ 新建文章</Button>
      </div>

      {list.isLoading && (
        <div style={{ display: 'grid', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={86} />)}
        </div>
      )}
      {list.error && !list.isLoading && (
        <div className="zy-state" data-testid="list-error">
          <div className="zy-state-icon">⚠️</div>
          <div>{(list.error as Error).message}</div>
          <Button onClick={() => list.refetch()}>重试</Button>
        </div>
      )}
      {list.data && list.data.items.length === 0 && (
        <div className="zy-state" data-testid="empty-state">
          <div className="zy-state-icon">📭</div>
          <div>{debouncedQ ? '没有匹配的文章' : '该类目还没有文章'}</div>
          {!debouncedQ && <Button onClick={() => setShowNew(true)}>+ 新建一篇</Button>}
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }} data-testid="article-rows">
        {list.data?.items.map((a) => (
          <GlassCard key={a.id} data-testid={`article-row-${a.code}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                  <code
                    style={{ background: 'var(--zy-card-2)', padding: '2px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                    title="点击复制"
                    data-testid={`article-code-${a.code}`}
                    onClick={() => {
                      void navigator.clipboard?.writeText(a.code).then(() => toast.success('已复制'));
                    }}
                  >{a.code}</code>
                  {a.status === 'published'
                    ? <Tag variant="success" testId={`article-status-${a.code}`}>已发布</Tag>
                    : <Tag variant="default" testId={`article-status-${a.code}`}>草稿</Tag>}
                  <span style={{ color: 'var(--zy-fg-soft)', fontSize: 12, whiteSpace: 'nowrap' }}>{a.sentence_count} 句</span>
                </div>
                <div style={{ color: 'var(--zy-fg-soft)', fontSize: 12, marginBottom: 4 }}>
                  更新 {new Date(a.updated_at).toLocaleString()}{a.updated_by_name ? ` · ${a.updated_by_name}` : ''}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{a.title_i18n.zh}</div>
                <div style={{ color: 'var(--zy-fg-soft)', fontSize: 12 }}>{a.title_pinyin}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button variant="ghost" data-testid={`edit-${a.code}`} onClick={() => nav({ to: '/china/articles/$id', params: { id: a.id } })}>编辑</Button>
                {a.status === 'draft'
                  ? <Button data-testid={`publish-${a.code}`} disabled={a.sentence_count === 0} onClick={() => setConfirm({ kind: 'publish', row: a })}>发布</Button>
                  : <Button variant="ghost" data-testid={`unpublish-${a.code}`} onClick={() => setConfirm({ kind: 'unpublish', row: a })}>下架</Button>}
                <Button variant="ghost" data-testid={`delete-${a.code}`} onClick={() => setConfirm({ kind: 'delete', row: a })}>删除</Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {list.data && list.data.pagination.total > pageSize && (
        <div style={{ marginTop: 16 }}>
          <Pagination page={page} pageSize={pageSize} total={list.data.pagination.total} onChange={setPage} testId="pagination" />
        </div>
      )}

      <NewArticleModal
        open={showNew}
        initialCategoryCode={code}
        onClose={() => setShowNew(false)}
          onCreated={(a) => { setShowNew(false); nav({ to: '/china/articles/$id', params: { id: a.id } }); }}
      />

      {confirm && (
        <ConfirmDialog
          open
          testId={`confirm-${confirm.kind}`}
          title={confirm.kind === 'publish' ? '发布文章' : confirm.kind === 'unpublish' ? '下架文章' : '删除文章'}
          danger={confirm.kind === 'delete'}
          okText={confirm.kind === 'delete' ? '删除' : confirm.kind === 'publish' ? '发布' : '下架'}
          body={
            confirm.kind === 'publish'
              ? <>确认发布「{confirm.row.title_i18n.zh}」？发布后将对所有用户可见。</>
              : confirm.kind === 'unpublish'
              ? <>确认下架「{confirm.row.title_i18n.zh}」？下架后用户将无法访问。</>
              : <>确认删除「{confirm.row.title_i18n.zh}」？此操作不可恢复，且会删除关联的所有句子与音频。</>
          }
          onCancel={() => setConfirm(null)}
          onConfirm={doAction}
        />
      )}
    </div>
  );
}
