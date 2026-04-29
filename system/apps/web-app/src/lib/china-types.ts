// 与 F2 接口契约对齐的最小类型集合（避免依赖 shared-schemas zod 类型）
// 所有 *_i18n 字段统一是 5 语言映射，前端按当前 UI 语言取键并回退 en→zh。

export type Locale = 'zh' | 'en' | 'vi' | 'th' | 'id';
export const LOCALES: Locale[] = ['zh', 'en', 'vi', 'th', 'id'];

export type I18nMap = Partial<Record<Locale, string>>;

export type ChinaCategory = {
  id: string;
  code: string;
  name_i18n: I18nMap;
  description_i18n: I18nMap;
  sort_order: number;
  // 应用端
  published_article_count?: number;
  requires_login?: boolean;
  // 管理端
  article_count_total?: number;
  article_count_published?: number;
  article_count_draft?: number;
};

export type ChinaArticleSummary = {
  id: string;
  code: string;
  title_pinyin: string;
  title_i18n: I18nMap;
  status?: 'draft' | 'published';
  sentence_count: number;
  category?: { id: string; code: string; name_i18n?: I18nMap };
  category_code?: string;
  published_at?: string | null;
  updated_at?: string;
  updated_by_name?: string | null;
  /** 搜索结果命中片段（带 <em>...</em>），仅 q 非空时下发 */
  highlights?: Array<{ field: string; snippet: string }>;
};

export type ChinaArticleDetail = ChinaArticleSummary & {
  sentences?: ChinaSentence[];
  prev?: { code: string; title_i18n: I18nMap } | null;
  next?: { code: string; title_i18n: I18nMap } | null;
};

export type SentenceAudio = {
  status: 'pending' | 'processing' | 'ready' | 'failed';
  url?: string | null;
  duration_ms?: number | null;
  reason?: string | null;
};

export type ChinaSentence = {
  id: string;
  seq_no: number;
  seq_label: string; // 4-digit
  pinyin: string;
  content_zh: string;
  content_en: string;
  content_vi: string;
  content_th: string;
  content_id: string;
  // API may return either flat content_* fields or nested content: {zh, ...}
  content?: { zh: string; en: string; vi: string; th: string; id: string };
  audio?: SentenceAudio;
  audio_status?: SentenceAudio['status'];
  audio_url?: string | null;
};

export function pickI18n(map: I18nMap | undefined, lang: Locale, fallbacks: Locale[] = ['en', 'zh']): string {
  if (!map) return '';
  const ordered: Locale[] = [lang, ...fallbacks.filter((l) => l !== lang)];
  for (const l of ordered) {
    const v = map[l];
    if (typeof v === 'string' && v.trim()) return v;
  }
  // 任意非空
  const any = Object.values(map).find((v) => typeof v === 'string' && (v as string).trim());
  return (any as string) ?? '';
}

export function fourDigit(n: number): string {
  return String(n).padStart(4, '0');
}
