// 管理端：china 服务层 · 类目（A1）
import type { SupabaseClient } from '@supabase/supabase-js';
import { CHINA_LOCALES, type ChinaLocale } from '@zhiyu/shared-schemas';
import { failByCode } from '../../middlewares/respond.ts';

export interface AdminCategoryItem {
  id: string;
  code: string;
  name_i18n: Record<ChinaLocale, string>;
  description_i18n: Record<ChinaLocale, string>;
  sort_order: number;
  article_count_total: number;
  article_count_published: number;
  article_count_draft: number;
}

export async function listCategoriesAdmin(sb: SupabaseClient): Promise<AdminCategoryItem[]> {
  const { data, error } = await sb
    .from('china_categories')
    .select('id, code, name_i18n, description_i18n, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  const cats = (data ?? []) as Array<{
    id: string;
    code: string;
    name_i18n: unknown;
    description_i18n: unknown;
    sort_order: number;
  }>;

  const ids = cats.map((c) => c.id);
  const counts = new Map<string, { total: number; published: number; draft: number }>();
  if (ids.length) {
    const { data: cnts } = await sb
      .from('v_china_category_counts')
      .select('category_id, total, published, draft')
      .in('category_id', ids);
    for (const r of (cnts ?? []) as Array<{ category_id: string; total: number; published: number; draft: number }>) {
      counts.set(r.category_id, {
        total: Number(r.total) || 0,
        published: Number(r.published) || 0,
        draft: Number(r.draft) || 0,
      });
    }
  }

  return cats.map((c) => {
    const cnt = counts.get(c.id) ?? { total: 0, published: 0, draft: 0 };
    return {
      id: c.id,
      code: c.code,
      name_i18n: ensureLocaleDict(c.name_i18n),
      description_i18n: ensureLocaleDict(c.description_i18n),
      sort_order: c.sort_order,
      article_count_total: cnt.total,
      article_count_published: cnt.published,
      article_count_draft: cnt.draft,
    };
  });
}

export async function getCategoryAdmin(
  sb: SupabaseClient,
  code: string,
): Promise<AdminCategoryItem> {
  const { data, error } = await sb
    .from('china_categories')
    .select('id, code, name_i18n, description_i18n, sort_order')
    .eq('code', code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) failByCode('CHINA_CATEGORY_NOT_FOUND');
  const cat = data as {
    id: string;
    code: string;
    name_i18n: unknown;
    description_i18n: unknown;
    sort_order: number;
  };
  const { data: cnt } = await sb
    .from('v_china_category_counts')
    .select('total, published, draft')
    .eq('category_id', cat.id)
    .maybeSingle();
  const c = (cnt as { total: number; published: number; draft: number } | null) ?? { total: 0, published: 0, draft: 0 };
  return {
    id: cat.id,
    code: cat.code,
    name_i18n: ensureLocaleDict(cat.name_i18n),
    description_i18n: ensureLocaleDict(cat.description_i18n),
    sort_order: cat.sort_order,
    article_count_total: Number(c.total) || 0,
    article_count_published: Number(c.published) || 0,
    article_count_draft: Number(c.draft) || 0,
  };
}

function ensureLocaleDict(input: unknown): Record<ChinaLocale, string> {
  const out: Record<string, string> = {};
  const src = (input ?? {}) as Record<string, unknown>;
  for (const k of CHINA_LOCALES) {
    out[k] = typeof src[k] === 'string' ? (src[k] as string) : '';
  }
  return out as Record<ChinaLocale, string>;
}
