import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, GlassCard, Input, Pagination, Select, SkeletonCard, Tabs, Tag, useToast } from '@zhiyu/ui-kit';
import { adminApi } from '../../lib/http.ts';
import type { AdminArticle, AdminCategory, AdminSentence, AudioStatus, I18nMap, Locale } from '../../lib/types.ts';
import { LOCALES, LOCALE_LABELS, fourDigit } from '../../lib/types.ts';
import { useBeforeUnloadGuard } from '../../lib/dirty.ts';
import { SentenceEditDrawer } from './dialogs/SentenceEditDrawer.tsx';
import { SentenceCreateDrawer } from './dialogs/SentenceCreateDrawer.tsx';
import { ReorderDrawer } from './dialogs/ReorderDrawer.tsx';
import { ConfirmDialog, UnsavedChangesModal } from './dialogs/ConfirmDialog.tsx';

const empty: I18nMap = { zh: '', en: '', vi: '', th: '', id: '' };

type SentencePosition = { mode: 'append' } | { mode: 'prepend' } | { mode: 'after'; afterSeqNo: number };

function StatusTag({ status }: { status: AudioStatus }) {
  if (status === 'ready') return <Tag variant="success" testId="audio-ready">就绪</Tag>;
  if (status === 'processing' || status === 'pending') return <Tag variant="warn" testId="audio-pending">生成中…</Tag>;
  return <Tag variant="danger" testId="audio-failed">失败</Tag>;
}

export function AdminChinaArticleEditPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ?? '';
  const nav = useNavigate();
  const toast = useToast();

  const cats = useQuery({
    queryKey: ['admin-china-categories'],
    queryFn: () => adminApi<{ items: AdminCategory[] }>('/china/categories'),
    staleTime: 60_000,
  });

  const article = useQuery({
    queryKey: ['admin-china-article', id],
    queryFn: () => adminApi<AdminArticle>(`/china/articles/${id}`),
    enabled: !!id,
  });

  const [categoryId, setCategoryId] = useState('');
  const [titlePinyin, setTitlePinyin] = useState('');
  const [titleI18n, setTitleI18n] = useState<I18nMap>({ ...empty });
  const [tab, setTab] = useState<Locale>('zh');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaErr, setMetaErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [readonly, setReadonly] = useState(true);
  const [editingSentence, setEditingSentence] = useState<AdminSentence | null>(null);
  const [createPos, setCreatePos] = useState<SentencePosition | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<AdminSentence | null>(null);
  const [unsaved, setUnsaved] = useState<{ run: () => void } | null>(null);
  const [confirmArticle, setConfirmArticle] = useState<'publish' | 'unpublish' | 'delete' | null>(null);

  const sentences = useQuery({
    queryKey: ['admin-china-sentences', article.data?.id],
    queryFn: () => adminApi<{ items: AdminSentence[] }>(
      `/china/sentences?article_id=${article.data!.id}`
    ),
    enabled: !!article.data?.id,
  });

  // hydrate baseline
  useEffect(() => {
    if (article.data) {
      setCategoryId(article.data.category.id);
      setTitlePinyin(article.data.title_pinyin);
      setTitleI18n(article.data.title_i18n);
    }
  }, [article.data]);

  const metaDirty = useMemo(() => {
    if (!article.data) return false;
    if (categoryId !== article.data.category.id) return true;
    if (titlePinyin !== article.data.title_pinyin) return true;
    return LOCALES.some((l) => titleI18n[l] !== article.data!.title_i18n[l]);
  }, [article.data, categoryId, titlePinyin, titleI18n]);

  useBeforeUnloadGuard(metaDirty);

  const errorTabs = useMemo(() => {
    const errs = new Set<Locale>();
    for (const lng of LOCALES) {
      if (!titleI18n[lng].trim() || titleI18n[lng].length > 100) errs.add(lng);
    }
    return errs;
  }, [titleI18n]);

  const metaValid = !!categoryId && titlePinyin.trim() && titlePinyin.length <= 200 && errorTabs.size === 0;

  async function saveMeta() {
    if (!article.data || !metaValid) return;
    setSavingMeta(true); setMetaErr(null);
    try {
      await adminApi(`/china/articles/${article.data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          category_id: categoryId,
          title_pinyin: titlePinyin.trim(),
          title_i18n: titleI18n,
        }),
      });
      toast.success('已保存');
      await article.refetch();
    } catch (e) { setMetaErr((e as Error).message); }
    finally { setSavingMeta(false); }
  }

  function guardedNav(run: () => void) {
    if (metaDirty) setUnsaved({ run }); else run();
  }

  async function articleAction() {
    if (!article.data || !confirmArticle) return;
    const aid = article.data.id;
    const isAlreadyMessage = (msg: string, kind: 'publish' | 'unpublish') => {
      if (kind === 'publish') return /CHINA_ARTICLE_ALREADY_PUBLISHED/i.test(msg);
      return /CHINA_ARTICLE_ALREADY_DRAFT/i.test(msg);
    };
    try {
      if (confirmArticle === 'publish') {
        try {
          await adminApi(`/china/articles/${aid}/publish`, { method: 'POST' });
        } catch (e) {
          // 幂等：若已发布，视为成功，仅静默刷新
          if (!isAlreadyMessage((e as Error).message, 'publish')) throw e;
        }
        toast.success('已发布');
        setConfirmArticle(null);
        await article.refetch();
      } else if (confirmArticle === 'unpublish') {
        try {
          await adminApi(`/china/articles/${aid}/unpublish`, { method: 'POST' });
        } catch (e) {
          if (!isAlreadyMessage((e as Error).message, 'unpublish')) throw e;
        }
        toast.success('已下架');
        setConfirmArticle(null);
        await article.refetch();
      } else {
        await adminApi(`/china/articles/${aid}`, { method: 'DELETE' });
        toast.success('已删除');
        setConfirmArticle(null);
        nav({ to: '/china/categories/$code', params: { code: article.data.category.code } });
      }
    } catch (e) {
      toast.error((e as Error).message || '操作失败');
      // keep dialog open so user sees inline error too
      throw e;
    }
  }

  async function deleteSentence() {
    if (!delTarget) return;
    await adminApi(`/china/sentences/${delTarget.id}`, { method: 'DELETE' });
    toast.success('已删除');
    setDelTarget(null);
    await sentences.refetch();
    await article.refetch();
  }

  if (article.isLoading) return <div style={{ padding: 24 }}><SkeletonCard height={180} /></div>;
  if (article.error || !article.data) return (
    <div className="zy-state" data-testid="article-load-error">
      <div className="zy-state-icon">⚠️</div>
      <div>{(article.error as Error)?.message ?? '加载失败'}</div>
      <Button onClick={() => article.refetch()}>重试</Button>
    </div>
  );

  const a = article.data;
  const allSentences = sentences.data?.items ?? [];
  const total = allSentences.length;
  const pageItems = allSentences.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ padding: 24, paddingBottom: 96 }} data-testid="article-edit">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button
          variant="ghost"
          data-testid="back-to-list"
          onClick={() => guardedNav(() =>
            nav({ to: '/china/categories/$code', params: { code: a.category.code } }),
          )}
        >← 返回列表</Button>
        <h2 style={{ margin: 0, fontSize: 18, whiteSpace: 'nowrap' }}>编辑文章</h2>
        <code style={{ background: 'var(--zy-card-2)', padding: '2px 6px', borderRadius: 6, fontSize: 12 }} data-testid="article-code">{a.code}</code>
        {a.status === 'published' ? <Tag variant="success">已发布</Tag> : <Tag>草稿</Tag>}
        <span style={{ color: 'var(--zy-fg-soft)', fontSize: 12 }}>{a.sentence_count} 句</span>
      </div>

      <GlassCard data-testid="meta-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>基础信息</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="zy-field">
            <label className="zy-label"><span className="zy-required">*</span>类目</label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} data-testid="meta-category">
              {cats.data?.items.slice().sort((x, y) => x.sort_order - y.sort_order).map((c) => (
                <option key={c.id} value={c.id}>#{c.code} {c.name_i18n.zh}</option>
              ))}
            </Select>
          </div>
          <div className="zy-field">
            <label className="zy-label"><span className="zy-required">*</span>标题拼音</label>
            <Input data-testid="meta-pinyin" value={titlePinyin} onChange={(e) => setTitlePinyin(e.target.value)} maxLength={200} />
            <div className="zy-helper">{titlePinyin.length}/200</div>
          </div>
          <div className="zy-field">
            <label className="zy-label"><span className="zy-required">*</span>标题（5 语言必填）</label>
            <Tabs
              items={LOCALES.map((l) => ({ key: l, label: LOCALE_LABELS[l], flag: errorTabs.has(l) ? 'error' : undefined }))}
              active={tab}
              onChange={(k) => setTab(k as Locale)}
              testIdPrefix="meta-lang"
            />
            <Input
              data-testid={`meta-title-${tab}`}
              value={titleI18n[tab]}
              onChange={(e) => setTitleI18n({ ...titleI18n, [tab]: e.target.value })}
              maxLength={100}
            />
            <div className="zy-helper">{titleI18n[tab].length}/100</div>
          </div>
          {metaErr && <p className="zy-error-text" data-testid="meta-error">{metaErr}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={saveMeta} disabled={!metaValid || !metaDirty || savingMeta} data-testid="save-meta">
              {savingMeta ? '保存中…' : metaDirty ? '保存基础信息' : '已保存'}
            </Button>
            {metaDirty && <span style={{ color: 'var(--zy-fg-soft)', alignSelf: 'center', fontSize: 12 }}>有未保存的修改</span>}
          </div>
        </div>
      </GlassCard>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>句子（{a.sentence_count}）</h3>
        <label className="zy-switch" data-testid="readonly-switch">
          <input type="checkbox" checked={!readonly} onChange={(e) => setReadonly(!e.target.checked)} />
          <span>{readonly ? '🔒 只读模式' : '🔓 编辑模式'}</span>
        </label>
        <span style={{ flex: 1 }} />
        <Button variant="ghost" data-testid="reorder-open" disabled={a.sentence_count < 2} onClick={() => setReorderOpen(true)}>调整顺序</Button>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button data-testid="add-end" onClick={() => setCreatePos({ mode: 'append' })}>+ 末尾添加</Button>
          <Button variant="ghost" data-testid="add-begin" disabled={a.sentence_count === 0} onClick={() => setCreatePos({ mode: 'prepend' })}>+ 开头添加</Button>
        </div>
      </div>

      {sentences.isLoading && (
        <div style={{ display: 'grid', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={120} />)}
        </div>
      )}

      {sentences.data && sentences.data.items.length === 0 && (
        <div className="zy-state" data-testid="sentence-empty">
          <div className="zy-state-icon">📝</div>
          <div>还没有句子，开始添加第一句吧</div>
          <Button onClick={() => setCreatePos({ mode: 'append' })}>+ 添加句子</Button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }} data-testid="sentence-list">
        {pageItems.map((s) => (
          <GlassCard key={s.id} data-testid={`sentence-${s.seq_no}`} className="zy-sentence-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', color: 'var(--zy-fg-mute)' }}>#{fourDigit(s.seq_no)}</span>
                  <StatusTag status={s.audio_status} />
                  {s.audio_duration_ms != null && <span style={{ fontSize: 11, color: 'var(--zy-fg-soft)' }}>{(s.audio_duration_ms / 1000).toFixed(1)}s</span>}
                </div>
                <div className="zy-pinyin" style={{ fontSize: 13 }}>{s.pinyin}</div>
                <div className="zy-zh" style={{ fontSize: 16, fontWeight: 500 }}>{s.content_zh}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 4, marginTop: 6, fontSize: 12, color: 'var(--zy-fg-soft)' }}>
                  <span>EN: {s.content_en}</span>
                  <span>VI: {s.content_vi}</span>
                  <span>TH: {s.content_th}</span>
                  <span>ID: {s.content_id}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" data-testid={`sentence-edit-${s.seq_no}`} disabled={readonly} onClick={() => setEditingSentence(s)}>编辑</Button>
                  <Button variant="ghost" data-testid={`sentence-insert-${s.seq_no}`} disabled={readonly} onClick={() => setCreatePos({ mode: 'after', afterSeqNo: s.seq_no })}>↓ 插入</Button>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" data-testid={`sentence-delete-${s.seq_no}`} disabled={readonly} onClick={() => setDelTarget(s)}>删除</Button>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {total > pageSize && (
        <div style={{ marginTop: 16 }}>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} testId="sentence-pagination" />
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, padding: 12,
        background: 'var(--zy-card)', borderTop: '1px solid var(--zy-border)',
        display: 'flex', gap: 8, justifyContent: 'flex-end', zIndex: 50,
      }} data-testid="action-bar">
        {a.status === 'draft'
          ? <Button data-testid="article-publish" disabled={a.sentence_count === 0} onClick={() => setConfirmArticle('publish')}>发布</Button>
          : <Button variant="ghost" data-testid="article-unpublish" onClick={() => setConfirmArticle('unpublish')}>下架</Button>}
        <Button variant="ghost" data-testid="article-delete" onClick={() => setConfirmArticle('delete')}>删除文章</Button>
      </div>

      <SentenceEditDrawer
        open={!!editingSentence}
        sentence={editingSentence}
        onClose={() => setEditingSentence(null)}
        onSaved={async () => { setEditingSentence(null); await sentences.refetch(); }}
      />
      {createPos && (
        <SentenceCreateDrawer
          open
          articleId={a.id}
          position={createPos}
          onClose={() => setCreatePos(null)}
          onCreated={async () => { setCreatePos(null); await sentences.refetch(); await article.refetch(); }}
        />
      )}
      {reorderOpen && sentences.data && (
        <ReorderDrawer
          open
          articleId={a.id}
          sentences={sentences.data.items}
          onClose={() => setReorderOpen(false)}
          onSaved={async () => { setReorderOpen(false); await sentences.refetch(); }}
        />
      )}
      {delTarget && (
        <ConfirmDialog
          open
          testId="confirm-delete-sentence"
          title="删除句子"
          danger
          okText="删除"
          body={<>确认删除第 {delTarget.seq_no} 句？删除后后续句子序号将自动顺移，此操作不可恢复。</>}
          onCancel={() => setDelTarget(null)}
          onConfirm={deleteSentence}
        />
      )}
      {confirmArticle && (
        <ConfirmDialog
          open
          testId={`confirm-article-${confirmArticle}`}
          title={confirmArticle === 'publish' ? '发布文章' : confirmArticle === 'unpublish' ? '下架文章' : '删除文章'}
          danger={confirmArticle === 'delete'}
          okText={confirmArticle === 'delete' ? '删除' : confirmArticle === 'publish' ? '发布' : '下架'}
          body={
            confirmArticle === 'publish'
              ? <>确认发布「{a.title_i18n.zh}」？发布后所有用户可见。</>
              : confirmArticle === 'unpublish'
              ? <>确认下架？下架后用户将无法访问。</>
              : <>此操作不可恢复，将同时删除所有句子与音频。</>
          }
          onCancel={() => setConfirmArticle(null)}
          onConfirm={articleAction}
        />
      )}
      {unsaved && (
        <UnsavedChangesModal
          open
          onStay={() => setUnsaved(null)}
          onLeave={() => { const r = unsaved.run; setUnsaved(null); r(); }}
        />
      )}
    </div>
  );
}
