import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, GlassCard, Input, Pagination, Select, SkeletonCard, Tag } from '@zhiyu/ui-kit';
import { adminApi } from '../../lib/http.ts';
import type { AdminSearchResp } from '../../lib/types.ts';

// 仅允许 <em> 标签透传：服务端已生成 HTML，但出于纵深防御，再做一次白名单清洗。
function sanitizeEm(html: string): string {
  if (!html) return '';
  // 1. 移除任何 <script>/<iframe> 等危险标签 与 on* 事件
  // 2. 仅保留 <em>...</em>，其他标签直接转义
  const allowed = new Set(['em']);
  // 把 < 转义后再把允许的 <em>/</em> 还原
  const escaped = html.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
  return escaped.replace(/&lt;(\/)?(\w+)&gt;/g, (m, slash, tag) => {
    if (allowed.has(String(tag).toLowerCase())) return `<${slash ? '/' : ''}${String(tag).toLowerCase()}>`;
    return m;
  });
}

type Search = { q?: string; type?: 'all' | 'articles' | 'sentences'; page?: number };

export function AdminChinaSearchPage() {
  const sp = useSearch({ strict: false }) as Search;
  const nav = useNavigate();
  const [q, setQ] = useState(sp.q ?? '');
  const [debouncedQ, setDebouncedQ] = useState(sp.q ?? '');
  const [type, setType] = useState<NonNullable<Search['type']>>(sp.type ?? 'all');
  const page = sp.page ?? 1;
  const pageSize = 20;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    nav({ to: '/china/search', search: { q: debouncedQ || undefined, type, page: 1 } as never, replace: true });
  }, [debouncedQ, type]);

  const res = useQuery({
    queryKey: ['admin-china-search', debouncedQ, type, page],
    queryFn: () => {
      const p = new URLSearchParams();
      p.set('q', debouncedQ);
      p.set('type', type);
      p.set('page', String(page));
      p.set('page_size', String(pageSize));
      return adminApi<AdminSearchResp>(`/china/search?${p.toString()}`);
    },
    enabled: debouncedQ.length > 0,
  });

  return (
    <div style={{ padding: 24 }} data-testid="admin-search-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Button variant="ghost" data-testid="back" onClick={() => nav({ to: '/china' })}>← 返回</Button>
        <h2 style={{ margin: 0 }}>全局搜索</h2>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          data-testid="search-input"
          placeholder="🔍 输入关键字（标题或句子内容）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          style={{ flex: 1, minWidth: 280 }}
        />
        <Select data-testid="search-type" value={type} onChange={(e) => setType(e.target.value as Search['type'] as never)}>
          <option value="all">全部</option>
          <option value="articles">仅文章</option>
          <option value="sentences">仅句子</option>
        </Select>
      </div>

      {!debouncedQ && (
        <div className="zy-state" data-testid="search-empty">
          <div className="zy-state-icon">🔎</div>
          <div>输入关键字开始搜索</div>
        </div>
      )}

      {debouncedQ && res.isLoading && (
        <div style={{ display: 'grid', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={88} />)}
        </div>
      )}

      {debouncedQ && res.error && !res.isLoading && (
        <div className="zy-state" data-testid="search-error">
          <div className="zy-state-icon">⚠️</div>
          <div>{(res.error as Error).message}</div>
          <Button onClick={() => res.refetch()}>重试</Button>
        </div>
      )}

      {res.data && (
        <>
          <div style={{ color: 'var(--zy-fg-soft)', fontSize: 13, marginBottom: 12 }} data-testid="search-summary">
            共找到 文章 {res.data.summary.articles_total} · 句子 {res.data.summary.sentences_total}
          </div>

          {res.data.articles.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, color: 'var(--zy-fg-soft)' }}>文章命中</h3>
              <div style={{ display: 'grid', gap: 6 }}>
                {res.data.articles.map((a) => (
                  <GlassCard
                    key={a.id}
                    data-testid={`hit-article-${a.code}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => nav({ to: '/china/articles/$id', params: { id: a.id } })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav({ to: '/china/articles/$id', params: { id: a.id } }); } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <code style={{ background: 'var(--zy-card-2)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{a.code}</code>
                          <span style={{ fontSize: 12, color: 'var(--zy-fg-soft)' }}>#{a.category.code} {a.category.name_i18n.zh}</span>
                          {a.status === 'published' ? <Tag variant="success">已发布</Tag> : <Tag>草稿</Tag>}
                        </div>
                        <div className="zy-em" style={{ fontWeight: 600, fontSize: 15 }}
                             dangerouslySetInnerHTML={{ __html: sanitizeEm((a.highlights?.find((h) => h.field === 'title_zh')?.snippet) || a.title_i18n?.zh || a.title_i18n_html?.zh || '') }} />
                        <div style={{ color: 'var(--zy-fg-soft)', fontSize: 12 }}>{a.title_pinyin}</div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--zy-fg-mute)' }}>命中：{a.highlights?.[0]?.field || a.matched_field || ''}</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}

          {res.data.sentences.length > 0 && (
            <section>
              <h3 style={{ fontSize: 14, color: 'var(--zy-fg-soft)' }}>句子命中</h3>
              <div style={{ display: 'grid', gap: 6 }}>
                {res.data.sentences.map((s) => (
                  <GlassCard
                    key={s.id}
                    data-testid={`hit-sentence-${s.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => nav({ to: '/china/articles/$id', params: { id: s.article.id } })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav({ to: '/china/articles/$id', params: { id: s.article.id } }); } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--zy-fg-soft)', marginBottom: 4 }}>
                          {s.article.title_i18n.zh} · 第 {s.seq_no} 句
                        </div>
                        <div className="zy-em" dangerouslySetInnerHTML={{ __html: sanitizeEm(s.highlights?.[0]?.snippet || s.content_html || '') }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--zy-fg-mute)' }}>命中：{s.highlights?.[0]?.field || s.matched_field || ''}</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}

          {res.data.articles.length === 0 && res.data.sentences.length === 0 && (
            <div className="zy-state" data-testid="search-no-results">
              <div className="zy-state-icon">😶</div>
              <div>没有匹配的内容</div>
            </div>
          )}

          {(res.data.pagination?.has_next || page > 1) && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => nav({ to: '/china/search', search: { q: debouncedQ, type, page: page - 1 } as never, replace: true })}
                data-testid="search-prev"
              >上一页</Button>
              <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--zy-fg-soft)' }}>第 {page} 页</span>
              <Button
                variant="ghost"
                disabled={!res.data.pagination?.has_next}
                onClick={() => nav({ to: '/china/search', search: { q: debouncedQ, type, page: page + 1 } as never, replace: true })}
                data-testid="search-next"
              >下一页</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
