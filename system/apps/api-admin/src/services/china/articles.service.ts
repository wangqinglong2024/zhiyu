// 管理端：china 服务层 · 文章 CRUD（A2-A8）
import type { SupabaseClient } from '@supabase/supabase-js';
import { failByCode } from '../../middlewares/respond.ts';

export interface AdminArticleListQuery {
  category_code?: string;
  status: 'draft' | 'published' | 'all';
  q?: string;
  page: number;
  page_size: number;
  sort: 'updated_at' | 'created_at' | 'code';
}

export interface AdminArticleListItem {
  id: string;
  code: string;
  category: { id: string; code: string; name_i18n: unknown } | null;
  title_pinyin: string;
  title_i18n: unknown;
  status: 'draft' | 'published';
  sentence_count: number;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  updated_by: string | null;
}

export interface AdminArticleDetail extends AdminArticleListItem {}

interface ArticleRow {
  id: string;
  code: string;
  title_pinyin: string;
  title_i18n: unknown;
  status: 'draft' | 'published';
  published_at: string | null;
  updated_at: string;
  created_at: string;
  updated_by: string | null;
  category_id: string;
  category: { id: string; code: string; name_i18n: unknown } | null;
}

const ARTICLE_SELECT = 'id, code, title_pinyin, title_i18n, status, published_at, updated_at, created_at, updated_by, category_id, category:china_categories!fk_china_articles_category_id(id,code,name_i18n)';

export async function listArticlesAdmin(
  sb: SupabaseClient,
  q: AdminArticleListQuery,
): Promise<{ items: AdminArticleListItem[]; total: number }> {
  let query = sb
    .from('china_articles')
    .select(ARTICLE_SELECT, { count: 'exact' })
    .is('deleted_at', null);

  if (q.status !== 'all') query = query.eq('status', q.status);

  if (q.category_code) {
    const { data: cat } = await sb
      .from('china_categories').select('id').eq('code', q.category_code).maybeSingle();
    if (!cat) return { items: [], total: 0 };
    query = query.eq('category_id', (cat as { id: string }).id);
  }

  if (q.q && q.q.trim()) {
    const term = q.q.trim();
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
  }

  query = query.order(q.sort, { ascending: false, nullsFirst: false });
  const from = (q.page - 1) * q.page_size;
  query = query.range(from, from + q.page_size - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ArticleRow[];
  const cnt = await fetchSentenceCounts(sb, rows.map((r) => r.id));

  const items: AdminArticleListItem[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    category: r.category,
    title_pinyin: r.title_pinyin,
    title_i18n: r.title_i18n,
    status: r.status,
    sentence_count: cnt.get(r.id) ?? 0,
    published_at: r.published_at,
    updated_at: r.updated_at,
    created_at: r.created_at,
    updated_by: r.updated_by,
  }));
  return { items, total: count ?? items.length };
}

export async function getArticleAdmin(
  sb: SupabaseClient,
  id: string,
): Promise<AdminArticleDetail> {
  const { data, error } = await sb
    .from('china_articles')
    .select(ARTICLE_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) failByCode('CHINA_ARTICLE_NOT_FOUND');
  const r = data as unknown as ArticleRow;
  const cnt = await fetchSentenceCounts(sb, [r.id]);
  return {
    id: r.id,
    code: r.code,
    category: r.category,
    title_pinyin: r.title_pinyin,
    title_i18n: r.title_i18n,
    status: r.status,
    sentence_count: cnt.get(r.id) ?? 0,
    published_at: r.published_at,
    updated_at: r.updated_at,
    created_at: r.created_at,
    updated_by: r.updated_by,
  };
}

export async function createArticleAdmin(
  sb: SupabaseClient,
  actorId: string,
  payload: {
    category_id: string;
    title_pinyin: string;
    title_i18n: Record<string, string>;
  },
): Promise<AdminArticleDetail> {
  // 校验类目存在
  const { data: cat } = await sb
    .from('china_categories').select('id').eq('id', payload.category_id).maybeSingle();
  if (!cat) failByCode('CHINA_ARTICLE_CATEGORY_NOT_FOUND');

  // 调 RPC 生成 code
  const { data: codeRpc, error: cerr } = await sb.rpc('fn_gen_article_code');
  if (cerr) throw new Error(cerr.message);
  const code = codeRpc as string;

  const insertRow = {
    code,
    category_id: payload.category_id,
    title_pinyin: payload.title_pinyin,
    title_i18n: payload.title_i18n,
    status: 'draft' as const,
    created_by: actorId,
    updated_by: actorId,
  };
  const { data, error } = await sb
    .from('china_articles')
    .insert(insertRow)
    .select(ARTICLE_SELECT)
    .single();
  if (error) throw new Error(error.message);
  const r = data as unknown as ArticleRow;
  return {
    id: r.id, code: r.code, category: r.category,
    title_pinyin: r.title_pinyin, title_i18n: r.title_i18n, status: r.status,
    sentence_count: 0, published_at: r.published_at, updated_at: r.updated_at,
    created_at: r.created_at, updated_by: r.updated_by,
  };
}

export async function updateArticleAdmin(
  sb: SupabaseClient,
  id: string,
  actorId: string,
  payload: { category_id?: string; title_pinyin?: string; title_i18n?: Record<string, string> },
): Promise<AdminArticleDetail> {
  // 确认存在
  await getArticleAdmin(sb, id);

  if (payload.category_id) {
    const { data: cat } = await sb
      .from('china_categories').select('id').eq('id', payload.category_id).maybeSingle();
    if (!cat) failByCode('CHINA_ARTICLE_CATEGORY_NOT_FOUND');
  }

  const update: Record<string, unknown> = { updated_by: actorId };
  if (payload.category_id) update.category_id = payload.category_id;
  if (payload.title_pinyin) update.title_pinyin = payload.title_pinyin;
  if (payload.title_i18n) update.title_i18n = payload.title_i18n;

  const { error } = await sb.from('china_articles').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  return getArticleAdmin(sb, id);
}

export async function publishArticleAdmin(
  sb: SupabaseClient,
  id: string,
): Promise<AdminArticleDetail> {
  // 状态前置检查
  const cur = await getArticleAdmin(sb, id);
  if (cur.status === 'published') failByCode('CHINA_ARTICLE_ALREADY_PUBLISHED');
  const { error } = await sb.rpc('fn_publish_article', { p_article_id: id });
  if (error) {
    if (/CHINA_/.test(error.message)) throw new Error(error.message);
    throw new Error(error.message);
  }
  return getArticleAdmin(sb, id);
}

export async function unpublishArticleAdmin(
  sb: SupabaseClient,
  id: string,
): Promise<AdminArticleDetail> {
  const cur = await getArticleAdmin(sb, id);
  if (cur.status === 'draft') failByCode('CHINA_ARTICLE_ALREADY_DRAFT');
  const { error } = await sb.rpc('fn_unpublish_article', { p_article_id: id });
  if (error) throw new Error(error.message);
  return getArticleAdmin(sb, id);
}

export async function deleteArticleAdmin(
  sb: SupabaseClient,
  id: string,
): Promise<void> {
  await getArticleAdmin(sb, id); // 404 if missing
  const { error } = await sb.rpc('fn_delete_article', { p_article_id: id });
  if (error) throw new Error(error.message);
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
