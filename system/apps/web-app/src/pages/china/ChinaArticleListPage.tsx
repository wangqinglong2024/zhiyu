import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GlassCard, SkeletonCard, Input, Pagination, Button } from '@zhiyu/ui-kit';
import { api } from '../../lib/http.ts';
import type { ChinaArticleSummary, ChinaCategory, Locale } from '../../lib/china-types.ts';
import { pickI18n } from '../../lib/china-types.ts';

type ListResp = {
  items: ChinaArticleSummary[];
  pagination: { page: number; page_size: number; total: number };
};

export function ChinaArticleListPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Locale;
  const nav = useNavigate();
  const params = useParams({ strict: false }) as { code?: string };
  const code = params.code ?? '';

  const search = useSearch({ strict: false }) as { page?: number; q?: string };
  const [page, setPage] = useState<number>(Number(search.page) || 1);
  const [qInput, setQInput] = useState<string>(search.q ?? '');
  const [qDebounced, setQDebounced] = useState<string>(qInput);

  // 防抖 300ms
  useEffect(() => {
    const t1 = window.setTimeout(() => setQDebounced(qInput.trim()), 300);
    return () => window.clearTimeout(t1);
  }, [qInput]);

  // q 变化 → 回到第 1 页
  useEffect(() => { setPage(1); }, [qDebounced]);

  // URL 同步
  useEffect(() => {
    nav({
      to: '/china/categories/$code',
      params: { code },
      search: { page: page > 1 ? page : undefined, q: qDebounced || undefined } as never,
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, qDebounced]);

  const cats = useQuery({
    queryKey: ['china-categories'],
    queryFn: () => api<{ items: ChinaCategory[] }>('/china/categories'),
    staleTime: 60 * 60 * 1000,
  });
  const cat = cats.data?.items.find((c) => c.code === code);

  const list = useQuery({
    queryKey: ['china-articles', code, qDebounced, page],
    queryFn: () => api<ListResp>(`/china/articles?category_code=${encodeURIComponent(code)}&page=${page}&page_size=20${qDebounced ? `&q=${encodeURIComponent(qDebounced)}` : ''}&sort=published_at`),
    placeholderData: (prev) => prev,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.pagination.total ?? 0;

  const empty = useMemo(() => !list.isLoading && items.length === 0, [list.isLoading, items.length]);

  function escHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
  }
  function highlight(text: string, term: string): { __html: string } {
    if (!term) return { __html: escHtml(text) };
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return { __html: escHtml(text) };
    return { __html: `${escHtml(text.slice(0, idx))}<em>${escHtml(text.slice(idx, idx + term.length))}</em>${escHtml(text.slice(idx + term.length))}` };
  }
  function sanitizeEm(html: string): string {
    if (!html) return '';
    const escaped = html.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
    return escaped.replace(/&lt;(\/)?(em)&gt;/gi, (_m, slash) => `<${slash ? '/' : ''}em>`);
  }

  return (
    <div className="zy-container" data-testid="china-article-list">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Button variant="ghost" data-testid="back-btn" onClick={() => nav({ to: '/china' })}>← {t('common.back')}</Button>
      </div>
      <header style={{ marginBottom: 16 }}>
        <div style={{ color: 'var(--zy-fg-mute)', fontSize: 12 }}>#{code}</div>
        <h1 style={{ margin: 0, fontSize: 24 }} data-testid="cat-name">
          {cat ? pickI18n(cat.name_i18n, lang) : ''}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--zy-fg-soft)' }}>
          {cat ? pickI18n(cat.description_i18n, lang) : ''}
        </p>
      </header>

      <div style={{ marginBottom: 16 }}>
        <Input
          data-testid="article-search"
          placeholder={t('china.search_articles', { defaultValue: '搜索：标题/句子内容' })}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
      </div>

      {list.isLoading && (
        <div className="zy-stack">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={92} />)}</div>
      )}

      {!list.isLoading && list.error && (
        <div className="zy-state" data-testid="list-error">
          <div className="zy-state-icon">⚠️</div>
          <div>{(list.error as Error).message}</div>
          <Button onClick={() => list.refetch()}>{t('common.retry')}</Button>
        </div>
      )}

      {empty && (
        <div className="zy-state" data-testid="list-empty">
          <div className="zy-state-icon">📭</div>
          <div>
            {qDebounced
              ? t('china.no_search', { defaultValue: '没有找到匹配的文章，试试其他关键词？' })
              : t('china.no_articles', { defaultValue: '这个类目还没有文章，敬请期待' })}
          </div>
        </div>
      )}

      {!list.isLoading && !list.error && items.length > 0 && (
        <div className="zy-stack">
          {items.map((a) => {
            const sentenceHit = a.highlights?.find((h) => h.field.startsWith('content_') || h.field === 'pinyin');
            return (
              <GlassCard
                key={a.id}
                data-testid={`article-row-${a.code}`}
                role="button"
                tabIndex={0}
                onClick={() => nav({ to: '/china/articles/$code', params: { code: a.code } })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav({ to: '/china/articles/$code', params: { code: a.code } }); } }}
                style={{ cursor: 'pointer' }}
              >
                <div className="zy-pinyin">{a.title_pinyin}</div>
                <div className="zy-zh zy-em" dangerouslySetInnerHTML={highlight(pickI18n(a.title_i18n, 'zh'), qDebounced)} />
                {lang !== 'zh' && (
                  <div className="zy-trans zy-em" dangerouslySetInnerHTML={highlight(pickI18n(a.title_i18n, lang, ['en']), qDebounced)} />
                )}
                {sentenceHit && (
                  <div className="zy-em" style={{ marginTop: 6, fontSize: 13, color: 'var(--zy-fg-soft)', lineHeight: 1.55 }}
                       data-testid={`article-snippet-${a.code}`}
                       dangerouslySetInnerHTML={{ __html: sanitizeEm(sentenceHit.snippet) }} />
                )}
                <div className="zy-china-card-meta">
                  <span>{a.sentence_count} {t('china.sentences_unit', { defaultValue: '句' })}</span>
                  {a.published_at && <span>· {a.published_at.slice(0, 10)}</span>}
                  <span style={{ marginLeft: 'auto' }}>→</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <Pagination page={page} pageSize={20} total={total} onChange={setPage} />
      </div>
    </div>
  );
}
