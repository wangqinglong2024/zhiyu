// china 域：服务层 · 文章（应用端）
import type { SupabaseClient } from '@supabase/supabase-js';
import { failByCode } from '../../middlewares/respond.ts';

export interface ArticleListQuery {
  category_code?: string;
  q?: string;
  page: number;
  page_size: number;
  sort: 'updated_at' | 'published_at' | 'code';
}

export interface ArticleListItem {
  id: string;
  code: string;
  category: { code: string; name_i18n: unknown };
  title_pinyin: string;
  title_i18n: unknown;
  status: 'published';
  published_at: string | null;
  updated_at: string;
  sentence_count: number;
  /**
   * 搜索结果命中片段（带 <em>...</em> 高亮，已转义其他 HTML）；
   * 仅在 q 非空时下发，前端用 dangerouslySetInnerHTML 渲染。
   */
  highlights?: Array<{ field: string; snippet: string }>;
}

export interface ArticleDetail {
  id: string;
  code: string;
  category: { code: string; name_i18n: unknown };
  title_pinyin: string;
  title_i18n: unknown;
  status: 'published';
  published_at: string | null;
  updated_at: string;
  sentence_count: number;
  prev?: { code: string; title_i18n: unknown } | null;
  next?: { code: string; title_i18n: unknown } | null;
}

interface ArticleRow {
  id: string;
  code: string;
  title_pinyin: string;
  title_i18n: unknown;
  status: string;
  published_at: string | null;
  updated_at: string;
  category_id: string;
  category: { code: string; name_i18n: unknown } | null;
}

export async function listPublishedArticles(
  sb: SupabaseClient,
  q: ArticleListQuery,
): Promise<{ items: ArticleListItem[]; total: number }> {
  let query = sb
    .from('china_articles')
    .select('id, code, title_pinyin, title_i18n, status, published_at, updated_at, category_id, category:china_categories!fk_china_articles_category_id(code,name_i18n)', { count: 'exact' })
    .eq('status', 'published')
    .is('deleted_at', null);

  if (q.category_code) {
    // 类目 code → category_id
    const { data: cat } = await sb
      .from('china_categories').select('id').eq('code', q.category_code).maybeSingle();
    if (!cat) {
      return { items: [], total: 0 };
    }
    query = query.eq('category_id', (cat as { id: string }).id);
  }

  if (q.q && q.q.trim().length > 0) {
    const term = q.q.trim();
    // 先按 5 语言 title + pinyin + code 匹配；再补充：句子内容命中的文章 id（去重）
    const ors: string[] = [
      `code.ilike.%${escLike(term)}%`,
      `title_pinyin.ilike.%${escLike(term)}%`,
      `title_i18n->>zh.ilike.%${escLike(term)}%`,
      `title_i18n->>en.ilike.%${escLike(term)}%`,
      `title_i18n->>vi.ilike.%${escLike(term)}%`,
      `title_i18n->>th.ilike.%${escLike(term)}%`,
      `title_i18n->>id.ilike.%${escLike(term)}%`,
    ];
    // 句子表搜：5 语言 content + pinyin
    const sentenceArticleIds = await findArticleIdsBySentence(sb, term);
    if (sentenceArticleIds.length > 0) {
      // PostgREST `or` 中的 in.(...) 列表用括号包裹
      ors.push(`id.in.(${sentenceArticleIds.join(',')})`);
    }
    query = query.or(ors.join(','));
  }

  const sortCol = q.sort;
  query = query.order(sortCol, { ascending: false, nullsFirst: false });

  const from = (q.page - 1) * q.page_size;
  const to = from + q.page_size - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ArticleRow[];
  const ids = rows.map((r) => r.id);
  const cntMap = await fetchSentenceCounts(sb, ids);

  // 当 q 非空时，附带搜索高亮片段（标题命中 + 第一个匹配句子）
  const term = q.q?.trim() ?? '';
  const hlMap = term ? await buildHighlightsForArticles(sb, rows, term) : new Map<string, Array<{ field: string; snippet: string }>>();

  const items: ArticleListItem[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    category: r.category ?? { code: '', name_i18n: {} },
    title_pinyin: r.title_pinyin,
    title_i18n: r.title_i18n,
    status: 'published',
    published_at: r.published_at,
    updated_at: r.updated_at,
    sentence_count: cntMap.get(r.id) ?? 0,
    ...(term ? { highlights: hlMap.get(r.id) ?? [] } : {}),
  }));
  return { items, total: count ?? items.length };
}

export async function getPublishedArticleByCode(
  sb: SupabaseClient,
  code: string,
): Promise<ArticleDetail> {
  const { data, error } = await sb
    .from('china_articles')
    .select('id, code, title_pinyin, title_i18n, status, published_at, updated_at, category_id, category:china_categories!fk_china_articles_category_id(code,name_i18n)')
    .eq('code', code)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) failByCode('CHINA_ARTICLE_NOT_FOUND');
  const row = data as unknown as ArticleRow;
  const cnt = await fetchSentenceCounts(sb, [row.id]);
  const neighbors = await fetchNeighbors(sb, row);
  return {
    id: row.id,
    code: row.code,
    category: row.category ?? { code: '', name_i18n: {} },
    title_pinyin: row.title_pinyin,
    title_i18n: row.title_i18n,
    status: 'published',
    published_at: row.published_at,
    updated_at: row.updated_at,
    sentence_count: cnt.get(row.id) ?? 0,
    prev: neighbors.prev,
    next: neighbors.next,
  };
}

async function fetchNeighbors(
  sb: SupabaseClient,
  row: ArticleRow,
): Promise<{ prev: { code: string; title_i18n: unknown } | null; next: { code: string; title_i18n: unknown } | null }> {
  // 同类目下，按 published_at DESC, code DESC 排序的相邻文章（与列表默认排序一致）
  const { data, error } = await sb
    .from('china_articles')
    .select('code, title_i18n, published_at')
    .eq('category_id', row.category_id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('code', { ascending: false });
  if (error || !data) return { prev: null, next: null };
  const list = data as Array<{ code: string; title_i18n: unknown; published_at: string | null }>;
  const idx = list.findIndex((x) => x.code === row.code);
  if (idx < 0) return { prev: null, next: null };
  // 列表头部为「最新」；prev = 上一篇（更新的） = idx-1；next = 下一篇（更旧的） = idx+1
  const prev = idx > 0 ? { code: list[idx - 1].code, title_i18n: list[idx - 1].title_i18n } : null;
  const next = idx + 1 < list.length ? { code: list[idx + 1].code, title_i18n: list[idx + 1].title_i18n } : null;
  return { prev, next };
}

export interface ArticleSentenceItem {
  id: string;
  seq_no: number;
  seq_label: string;
  pinyin: string;
  content: { zh: string; en: string; vi: string; th: string; id: string };
  audio: { url: string | null; status: string };
}

export async function listPublishedArticleSentencesByCode(
  sb: SupabaseClient,
  code: string,
): Promise<ArticleSentenceItem[]> {
  const { data: art, error: aerr } = await sb
    .from('china_articles')
    .select('id')
    .eq('code', code)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();
  if (aerr) throw new Error(aerr.message);
  if (!art) failByCode('CHINA_ARTICLE_NOT_FOUND');

  const { data, error } = await sb
    .from('china_sentences')
    .select('id, seq_no, pinyin, content_zh, content_en, content_vi, content_th, content_id, audio_url_zh, audio_status')
    .eq('article_id', (art as { id: string }).id)
    .is('deleted_at', null)
    .order('seq_no', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => {
    const r = s as {
      id: string;
      seq_no: number;
      pinyin: string;
      content_zh: string;
      content_en: string;
      content_vi: string;
      content_th: string;
      content_id: string;
      audio_url_zh: string | null;
      audio_status: string;
    };
    return {
      id: r.id,
      seq_no: r.seq_no,
      seq_label: String(r.seq_no).padStart(4, '0'),
      pinyin: r.pinyin,
      content: {
        zh: r.content_zh,
        en: r.content_en,
        vi: r.content_vi,
        th: r.content_th,
        id: r.content_id,
      },
      audio: { url: r.audio_url_zh, status: r.audio_status },
    };
  });
}

async function fetchSentenceCounts(
  sb: SupabaseClient,
  articleIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!articleIds.length) return map;
  const { data, error } = await sb
    .from('china_sentences')
    .select('article_id')
    .in('article_id', articleIds)
    .is('deleted_at', null);
  if (error) return map;
  for (const r of (data ?? []) as Array<{ article_id: string }>) {
    map.set(r.article_id, (map.get(r.article_id) ?? 0) + 1);
  }
  return map;
}

async function findArticleIdsBySentence(
  sb: SupabaseClient,
  term: string,
): Promise<string[]> {
  const ors = [
    `pinyin.ilike.%${escLike(term)}%`,
    `content_zh.ilike.%${escLike(term)}%`,
    `content_en.ilike.%${escLike(term)}%`,
    `content_vi.ilike.%${escLike(term)}%`,
    `content_th.ilike.%${escLike(term)}%`,
    `content_id.ilike.%${escLike(term)}%`,
  ];
  const { data, error } = await sb
    .from('china_sentences')
    .select('article_id')
    .or(ors.join(','))
    .is('deleted_at', null)
    .limit(500);
  if (error || !data) return [];
  const ids = new Set<string>();
  for (const r of data as Array<{ article_id: string }>) ids.add(r.article_id);
  return Array.from(ids);
}

function escLike(s: string): string {
  return s.replace(/[\\%_,]/g, (m) => '\\' + m);
}

// ---- 搜索高亮 ----
async function buildHighlightsForArticles(
  sb: SupabaseClient,
  rows: ArticleRow[],
  term: string,
): Promise<Map<string, Array<{ field: string; snippet: string }>>> {
  const out = new Map<string, Array<{ field: string; snippet: string }>>();
  // 先按标题/拼音/code 命中
  const needSentenceLookup: string[] = [];
  for (const r of rows) {
    const hl: Array<{ field: string; snippet: string }> = [];
    if (containsCi(r.code, term)) hl.push({ field: 'code', snippet: snippetOf(r.code, term) });
    if (containsCi(r.title_pinyin, term)) hl.push({ field: 'title_pinyin', snippet: snippetOf(r.title_pinyin, term) });
    const ti = (r.title_i18n ?? {}) as Record<string, string>;
    for (const lng of ['zh', 'en', 'vi', 'th', 'id'] as const) {
      const v = ti[lng] ?? '';
      if (containsCi(v, term)) hl.push({ field: `title_i18n.${lng}`, snippet: snippetOf(v, term) });
    }
    if (hl.length === 0) needSentenceLookup.push(r.id);
    out.set(r.id, hl);
  }
  if (needSentenceLookup.length === 0) return out;

  // 句子命中：每篇文章取首条匹配的句子片段
  const ors = [
    `pinyin.ilike.%${escLike(term)}%`,
    `content_zh.ilike.%${escLike(term)}%`,
    `content_en.ilike.%${escLike(term)}%`,
    `content_vi.ilike.%${escLike(term)}%`,
    `content_th.ilike.%${escLike(term)}%`,
    `content_id.ilike.%${escLike(term)}%`,
  ];
  const { data, error } = await sb
    .from('china_sentences')
    .select('article_id, seq_no, pinyin, content_zh, content_en, content_vi, content_th, content_id')
    .in('article_id', needSentenceLookup)
    .or(ors.join(','))
    .is('deleted_at', null)
    .order('seq_no', { ascending: true })
    .limit(needSentenceLookup.length * 5);
  if (error || !data) return out;

  for (const s of data as Array<Record<string, unknown>>) {
    const aid = s.article_id as string;
    const existing = out.get(aid) ?? [];
    if (existing.length > 0) continue; // 每篇仅留首条句子片段
    let pickedField = '';
    let pickedText = '';
    for (const f of ['content_zh', 'content_en', 'content_vi', 'content_th', 'content_id', 'pinyin'] as const) {
      const v = (s[f] as string) ?? '';
      if (containsCi(v, term)) {
        pickedField = f;
        pickedText = v;
        break;
      }
    }
    if (pickedText) {
      existing.push({ field: pickedField, snippet: snippetOf(pickedText, term) });
      out.set(aid, existing);
    }
  }
  return out;
}

function containsCi(s: string, term: string): boolean {
  if (!s) return false;
  return s.toLowerCase().includes(term.toLowerCase());
}

function snippetOf(s: string, term: string): string {
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
