import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GlassCard, SkeletonCard, Modal, Button, Input } from '@zhiyu/ui-kit';
import { api } from '../../lib/http.ts';
import type { ChinaArticleSummary, ChinaCategory, Locale } from '../../lib/china-types.ts';
import { pickI18n } from '../../lib/china-types.ts';

type Resp = { items: ChinaCategory[] };

// 12 类目预置 emoji（A21）
const CAT_ICONS: Record<string, string> = {
  '01': '🏛', '02': '🍜', '03': '🏔', '04': '🎎', '05': '🎨', '06': '🎼',
  '07': '📜', '08': '🐉', '09': '☯️', '10': '🌆', '11': '🀄️', '12': '🧚',
};

export function ChinaCategoryCardsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Locale;
  const nav = useNavigate();

  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => api<{ authenticated: boolean }>('/auth/session'),
    staleTime: 30_000,
  });
  const authed = session.data?.authenticated === true;

  const q = useQuery({
    queryKey: ['china-categories'],
    queryFn: () => api<Resp>('/china/categories'),
    staleTime: 60 * 60 * 1000,
  });

  const [lockTip, setLockTip] = useState<{ open: boolean; code: string }>({ open: false, code: '' });

  // 全局搜索（跨类目）
  const [qInput, setQInput] = useState('');
  const [qDeb, setQDeb] = useState('');
  useEffect(() => {
    const tm = window.setTimeout(() => setQDeb(qInput.trim()), 300);
    return () => window.clearTimeout(tm);
  }, [qInput]);

  const searchQ = useQuery({
    queryKey: ['china-global-search', qDeb],
    queryFn: () => api<{ items: ChinaArticleSummary[]; pagination: { total: number } }>(
      `/china/articles?q=${encodeURIComponent(qDeb)}&page=1&page_size=20&sort=published_at`,
    ),
    enabled: qDeb.length > 0,
    placeholderData: (prev) => prev,
  });

  function highlight(text: string, term: string): { __html: string } {
    if (!term) return { __html: escHtml(text) };
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return { __html: escHtml(text) };
    const before = escHtml(text.slice(0, idx));
    const match = escHtml(text.slice(idx, idx + term.length));
    const after = escHtml(text.slice(idx + term.length));
    return { __html: `${before}<em>${match}</em>${after}` };
  }
  function escHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
  }
  // 服务端已生成 <em> 片段；纵深防御：仅放行 <em>/</em>，其余转义
  function sanitizeEm(html: string): string {
    if (!html) return '';
    const escaped = html.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
    return escaped.replace(/&lt;(\/)?(em)&gt;/gi, (_m, slash) => `<${slash ? '/' : ''}em>`);
  }

  const items = useMemo(() => (q.data?.items ?? []).slice().sort((a, b) => a.sort_order - b.sort_order), [q.data]);

  function clickCard(c: ChinaCategory) {
    const requiresLogin = c.requires_login ?? c.code >= '04';
    if (requiresLogin && !authed) {
      setLockTip({ open: true, code: c.code });
      return;
    }
    nav({ to: `/china/categories/${c.code}` });
  }

  return (
    <div className="zy-container" data-testid="china-cards">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>{t('china.title', { defaultValue: '发现中国' })}</h1>
        <Input
          data-testid="china-global-search"
          placeholder={t('china.search_articles', { defaultValue: '🔍 搜索：标题/句子内容' })}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          style={{ minWidth: 260, maxWidth: 400, flex: 1 }}
        />
      </div>

      {qDeb && (
        <section style={{ marginBottom: 16 }} data-testid="china-search-results">
          {searchQ.isLoading && (
            <div className="zy-stack">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={84} />)}</div>
          )}
          {searchQ.data && searchQ.data.items.length === 0 && (
            <div className="zy-state" data-testid="china-search-empty">
              <div className="zy-state-icon">😶</div>
              <div>{t('china.no_search', { defaultValue: '没有找到匹配的文章，试试其他关键词？' })}</div>
            </div>
          )}
          {searchQ.data && searchQ.data.items.length > 0 && (
            <div className="zy-stack">
              <div style={{ color: 'var(--zy-fg-soft)', fontSize: 12 }}>共 {searchQ.data.pagination.total} 条</div>
              {searchQ.data.items.map((a) => {
                const sentenceHit = a.highlights?.find((h) => h.field.startsWith('content_') || h.field === 'pinyin');
                return (
                  <GlassCard
                    key={a.id}
                    data-testid={`search-hit-${a.code}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => nav({ to: '/china/articles/$code', params: { code: a.code } })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav({ to: '/china/articles/$code', params: { code: a.code } }); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="zy-pinyin">{a.title_pinyin}</div>
                    <div className="zy-zh zy-em" dangerouslySetInnerHTML={highlight(pickI18n(a.title_i18n, 'zh'), qDeb)} />
                    {lang !== 'zh' && (
                      <div className="zy-trans zy-em" dangerouslySetInnerHTML={highlight(pickI18n(a.title_i18n, lang, ['en']), qDeb)} />
                    )}
                    {sentenceHit && (
                      <div className="zy-em" style={{ marginTop: 6, fontSize: 13, color: 'var(--zy-fg-soft)', lineHeight: 1.55 }}
                           data-testid={`search-snippet-${a.code}`}
                           dangerouslySetInnerHTML={{ __html: sanitizeEm(sentenceHit.snippet) }} />
                    )}
                    <div className="zy-china-card-meta">
                      <span>#{a.category?.code} {pickI18n(a.category?.name_i18n, lang)}</span>
                      <span>· {a.sentence_count} {t('china.sentences_unit', { defaultValue: '句' })}</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>
      )}

      {q.isLoading && !qDeb && (
        <div className="zy-grid-12">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} height={140} />)}
        </div>
      )}

      {q.error && !q.isLoading && (
        <div className="zy-state" data-testid="cards-error">
          <div className="zy-state-icon">⚠️</div>
          <div>{t('china.load_failed', { defaultValue: '内容加载失败' })}</div>
          <Button onClick={() => q.refetch()} data-testid="cards-retry">{t('common.retry')}</Button>
        </div>
      )}

      {q.data && (
        <div className="zy-grid-12" data-testid="categories-grid">
          {items.map((c) => {
            const requiresLogin = c.requires_login ?? c.code >= '04';
            const locked = requiresLogin && !authed;
            return (
              <GlassCard
                key={c.id}
                data-testid={`china-cat-${c.code}`}
                role="button"
                tabIndex={0}
                onClick={() => clickCard(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickCard(c); } }}
                className={`zy-china-card ${locked ? 'zy-china-card-locked' : ''}`}
              >
                {locked && <span className="zy-china-lock" aria-label="locked">🔒</span>}
                <div style={{ fontSize: 26 }}>{CAT_ICONS[c.code] ?? '📚'}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: 'var(--zy-fg-mute)', fontSize: 12 }}>#{c.code}</span>
                  <h3 style={{ margin: 0, fontSize: 17 }}>{pickI18n(c.name_i18n, lang)}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--zy-fg-soft)', fontSize: 13, lineHeight: 1.5,
                  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                  {pickI18n(c.description_i18n, lang)}
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}

      <LoginPromptModal
        open={lockTip.open}
        onClose={() => setLockTip({ open: false, code: '' })}
        onLogin={() => {
          const code = lockTip.code;
          setLockTip({ open: false, code: '' });
          nav({ to: '/auth/login', search: { redirect: `/china/categories/${code}` } as never });
        }}
      />
    </div>
  );
}

function LoginPromptModal({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={380}
      testId="login-prompt-modal"
      title={t('china.login_required_title', { defaultValue: '🔒 该类目需要登录后查看' })}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} data-testid="login-prompt-cancel">
            {t('china.login_later', { defaultValue: '再看看' })}
          </Button>
          <Button onClick={onLogin} data-testid="login-prompt-go">
            {t('china.login_go', { defaultValue: '去登录' })}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--zy-fg-soft)', lineHeight: 1.6 }}>
        {t('china.login_required_body', { defaultValue: '登录后你还可以保存阅读进度。' })}
      </p>
    </Modal>
  );
}
