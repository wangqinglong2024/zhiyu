// 管理端：china 服务层 · 全局搜索（A15）
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SearchQuery {
  q: string;
  scope: 'all' | 'articles' | 'sentences';
  category_code?: string;
  status: 'draft' | 'published' | 'all';
  page: number;
  page_size: number;
}

export interface ArticleHit {
  id: string;
  code: string;
  category: { code: string; name_i18n: unknown } | null;
  title_pinyin: string;
  title_i18n: unknown;
  status: string;
  sentence_count: number;
  updated_at: string;
  highlights: Array<{ field: string; snippet: string }>;
}

export interface SentenceHit {
  id: string;
  article: { id: string; code: string; title_i18n: unknown; category_code: string; status: string };
  seq_no: number;
  seq_label: string;
  highlights: Array<{ field: string; snippet: string }>;
}

export interface SearchResponse {
  summary: { articles_total: number; sentences_total: number; scope: string };
  articles: ArticleHit[];
  sentences: SentenceHit[];
  pagination: {
    page: number; page_size: number;
    articles_pages: number; sentences_pages: number; has_next: boolean;
  };
}

export async function searchAdmin(sb: SupabaseClient, q: SearchQuery): Promise<SearchResponse> {
  let articles: ArticleHit[] = [];
  let articlesTotal = 0;
  let sentences: SentenceHit[] = [];
  let sentencesTotal = 0;

  if (q.scope === 'all' || q.scope === 'articles') {
    const r = await searchArticles(sb, q);
    articles = r.items;
    articlesTotal = r.total;
  }
  if (q.scope === 'all' || q.scope === 'sentences') {
    const r = await searchSentences(sb, q);
    sentences = r.items;
    sentencesTotal = r.total;
  }

  const articles_pages = Math.ceil(articlesTotal / q.page_size);
  const sentences_pages = Math.ceil(sentencesTotal / q.page_size);
  return {
    summary: { articles_total: articlesTotal, sentences_total: sentencesTotal, scope: q.scope },
    articles,
    sentences,
    pagination: {
      page: q.page,
      page_size: q.page_size,
      articles_pages,
      sentences_pages,
      has_next: q.page < Math.max(articles_pages, sentences_pages),
    },
  };
}

async function searchArticles(
  sb: SupabaseClient,
  q: SearchQuery,
): Promise<{ items: ArticleHit[]; total: number }> {
  let categoryId: string | null = null;
  if (q.category_code) {
    const { data: cat } = await sb
      .from('china_categories').select('id').eq('code', q.category_code).maybeSingle();
    if (!cat) return { items: [], total: 0 };
    categoryId = (cat as { id: string }).id;
  }

  let query = sb
    .from('china_articles')
    .select('id, code, title_pinyin, title_i18n, status, updated_at, category_id, category:china_categories!fk_china_articles_category_id(code,name_i18n)', { count: 'exact' })
    .is('deleted_at', null);
  if (q.status !== 'all') query = query.eq('status', q.status);
  if (categoryId) query = query.eq('category_id', categoryId);

  const term = q.q;
  const ors = [
    `code.ilike.%${escLike(term)}%`,
    `title_pinyin.ilike.%${escLike(term)}%`,
    `title_i18n->>zh.ilike.%${escLike(term)}%`,
    `title_i18n->>en.ilike.%${escLike(term)}%`,
    `title_i18n->>vi.ilike.%${escLike(term)}%`,
    `title_i18n->>th.ilike.%${escLike(term)}%`,
    `title_i18n->>id.ilike.%${escLike(term)}%`,
  ];
  query = query.or(ors.join(','));
  query = query.order('updated_at', { ascending: false });
  const from = (q.page - 1) * q.page_size;
  query = query.range(from, from + q.page_size - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{
    id: string; code: string; title_pinyin: string; title_i18n: Record<string, string>;
    status: string; updated_at: string;
    category: { code: string; name_i18n: unknown } | null;
  }>;
  const ids = rows.map((r) => r.id);
  const cnt = await fetchSentenceCounts(sb, ids);

  const items: ArticleHit[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    category: r.category,
    title_pinyin: r.title_pinyin,
    title_i18n: r.title_i18n,
    status: r.status,
    sentence_count: cnt.get(r.id) ?? 0,
    updated_at: r.updated_at,
    highlights: buildArticleHighlights(r, term),
  }));
  return { items, total: count ?? items.length };
}

async function searchSentences(
  sb: SupabaseClient,
  q: SearchQuery,
): Promise<{ items: SentenceHit[]; total: number }> {
  // 句子表 join 文章 + 类目过滤
  let query = sb
    .from('china_sentences')
    .select(
      'id, seq_no, pinyin, content_zh, content_en, content_vi, content_th, content_id, article:china_articles!fk_china_sentences_article_id(id, code, title_i18n, status, deleted_at, category_id, category:china_categories!fk_china_articles_category_id(code))',
      { count: 'exact' },
    )
    .is('deleted_at', null);

  const term = q.q;
  const ors = [
    `pinyin.ilike.%${escLike(term)}%`,
    `content_zh.ilike.%${escLike(term)}%`,
    `content_en.ilike.%${escLike(term)}%`,
    `content_vi.ilike.%${escLike(term)}%`,
    `content_th.ilike.%${escLike(term)}%`,
    `content_id.ilike.%${escLike(term)}%`,
  ];
  query = query.or(ors.join(','));
  query = query.order('updated_at', { ascending: false });
  const from = (q.page - 1) * q.page_size;
  query = query.range(from, from + q.page_size - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rowsRaw = (data ?? []) as Array<{
    id: string; seq_no: number; pinyin: string;
    content_zh: string; content_en: string; content_vi: string; content_th: string; content_id: string;
    article: {
      id: string; code: string; title_i18n: unknown; status: string; deleted_at: string | null;
      category: { code: string } | null;
    } | null;
  }>;
  // 过滤：被删/类目/状态
  const rows = rowsRaw.filter((r) => {
    if (!r.article || r.article.deleted_at) return false;
    if (q.status !== 'all' && r.article.status !== q.status) return false;
    if (q.category_code && r.article.category?.code !== q.category_code) return false;
    return true;
  });

  const items: SentenceHit[] = rows.map((r) => ({
    id: r.id,
    article: {
      id: r.article!.id,
      code: r.article!.code,
      title_i18n: r.article!.title_i18n,
      category_code: r.article!.category?.code ?? '',
      status: r.article!.status,
    },
    seq_no: r.seq_no,
    seq_label: String(r.seq_no).padStart(4, '0'),
    highlights: buildSentenceHighlights(r, term),
  }));
  return { items, total: count ?? items.length };
}

function buildArticleHighlights(
  row: { code: string; title_pinyin: string; title_i18n: Record<string, string> },
  term: string,
): Array<{ field: string; snippet: string }> {
  const out: Array<{ field: string; snippet: string }> = [];
  if (containsCi(row.code, term)) out.push({ field: 'code', snippet: highlight(row.code, term) });
  if (containsCi(row.title_pinyin, term))
    out.push({ field: 'title_pinyin', snippet: highlight(row.title_pinyin, term) });
  for (const lang of ['zh', 'en', 'vi', 'th', 'id'] as const) {
    const v = row.title_i18n?.[lang] ?? '';
    if (containsCi(v, term)) out.push({ field: `title_i18n.${lang}`, snippet: highlight(v, term) });
  }
  return out;
}

function buildSentenceHighlights(
  row: {
    pinyin: string;
    content_zh: string; content_en: string; content_vi: string; content_th: string; content_id: string;
  },
  term: string,
): Array<{ field: string; snippet: string }> {
  const out: Array<{ field: string; snippet: string }> = [];
  if (containsCi(row.pinyin, term)) out.push({ field: 'pinyin', snippet: highlight(row.pinyin, term) });
  for (const lang of ['zh', 'en', 'vi', 'th', 'id'] as const) {
    const v = (row as Record<string, string>)[`content_${lang}`] ?? '';
    if (containsCi(v, term)) out.push({ field: `content_${lang}`, snippet: highlight(v, term) });
  }
  return out;
}

function containsCi(s: string, term: string): boolean {
  if (!s) return false;
  return s.toLowerCase().includes(term.toLowerCase());
}

function highlight(s: string, term: string): string {
  // 取以 term 为中心的 ±20 字符片段，并 escape，再仅保留 <em>
  const lower = s.toLowerCase();
  const ti = lower.indexOf(term.toLowerCase());
  if (ti < 0) return escapeHtml(s);
  const start = Math.max(0, ti - 20);
  const end = Math.min(s.length, ti + term.length + 20);
  const head = start > 0 ? '…' : '';
  const tail = end < s.length ? '…' : '';
  const before = escapeHtml(s.slice(start, ti));
  const match = escapeHtml(s.slice(ti, ti + term.length));
  const after = escapeHtml(s.slice(ti + term.length, end));
  return `${head}${before}<em>${match}</em>${after}${tail}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchSentenceCounts(
  sb: SupabaseClient,
  ids: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!ids.length) return map;
  const { data } = await sb
    .from('china_sentences')
    .select('article_id')
    .in('article_id', ids)
    .is('deleted_at', null);
  for (const r of (data ?? []) as Array<{ article_id: string }>) {
    map.set(r.article_id, (map.get(r.article_id) ?? 0) + 1);
  }
  return map;
}

function escLike(s: string): string {
  return s.replace(/[\\%_,]/g, (m) => '\\' + m);
}
