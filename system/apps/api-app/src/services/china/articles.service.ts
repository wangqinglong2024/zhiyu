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
    // 5 语言 title + pinyin + code
    const ors: string[] = [
      `code.ilike.%${escLike(term)}%`,
      `title_pinyin.ilike.%${escLike(term)}%`,
      `title_i18n->>zh.ilike.%${escLike(term)}%`,
      `title_i18n->>en.ilike.%${escLike(term)}%`,
      `title_i18n->>vi.ilike.%${escLike(term)}%`,
      `title_i18n->>th.ilike.%${escLike(term)}%`,
      `title_i18n->>id.ilike.%${escLike(term)}%`,
    ];
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
  };
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
  // 简化：逐文章统计；若数据量大可以建立 v_china_article_sentence_counts
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

function escLike(s: string): string {
  return s.replace(/[\\%_,]/g, (m) => '\\' + m);
}
