// china 域：服务层 · 类目（应用端）
import type { SupabaseClient } from '@supabase/supabase-js';
import { CHINA_LOCALES, type ChinaLocale } from '@zhiyu/shared-schemas';

export interface CategoryListItem {
  id: string;
  code: string;
  name_i18n: Record<ChinaLocale, string>;
  description_i18n: Record<ChinaLocale, string>;
  sort_order: number;
  /** 公开计数：仅统计已发布且未删的文章 */
  published_article_count: number;
  /** 是否需要登录才能浏览（前 3 个公开） */
  requires_login: boolean;
}

const PUBLIC_TIER_CODES = new Set(['01', '02', '03']);

export async function listCategoriesPublic(
  sb: SupabaseClient,
): Promise<CategoryListItem[]> {
  const { data: cats, error } = await sb
    .from('china_categories')
    .select('id, code, name_i18n, description_i18n, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);

  // 取每个类目下「published & 未删」的文章计数
  const ids = (cats ?? []).map((c) => (c as { id: string }).id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: cnt, error: cntErr } = await sb
      .from('v_china_category_counts')
      .select('category_id, published')
      .in('category_id', ids);
    if (!cntErr && cnt) {
      for (const r of cnt as Array<{ category_id: string; published: number }>) {
        counts.set(r.category_id, Number(r.published) || 0);
      }
    }
  }

  return (cats ?? []).map((c) => {
    const row = c as {
      id: string;
      code: string;
      name_i18n: Record<ChinaLocale, string>;
      description_i18n: Record<ChinaLocale, string>;
      sort_order: number;
    };
    return {
      id: row.id,
      code: row.code,
      name_i18n: ensureLocaleDict(row.name_i18n),
      description_i18n: ensureLocaleDict(row.description_i18n),
      sort_order: row.sort_order,
      published_article_count: counts.get(row.id) ?? 0,
      requires_login: !PUBLIC_TIER_CODES.has(row.code),
    };
  });
}

export function isPublicTier(categoryCode: string | null | undefined): boolean {
  if (!categoryCode) return false;
  return PUBLIC_TIER_CODES.has(categoryCode);
}

function ensureLocaleDict(input: unknown): Record<ChinaLocale, string> {
  const out: Record<string, string> = {};
  const src = (input ?? {}) as Record<string, unknown>;
  for (const k of CHINA_LOCALES) {
    out[k] = typeof src[k] === 'string' ? (src[k] as string) : '';
  }
  return out as Record<ChinaLocale, string>;
}
