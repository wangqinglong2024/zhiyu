export type Locale = 'zh' | 'en' | 'vi' | 'th' | 'id';
export const LOCALES: Locale[] = ['zh', 'en', 'vi', 'th', 'id'];
export const LOCALE_LABELS: Record<Locale, string> = {
  zh: '中文', en: 'English', vi: 'Tiếng Việt', th: 'ภาษาไทย', id: 'Bahasa',
};

export type I18nMap = Record<Locale, string>;

export type AdminCategory = {
  id: string;
  code: string;
  name_i18n: I18nMap;
  description_i18n: I18nMap;
  sort_order: number;
  article_count_total: number;
  article_count_published: number;
  article_count_draft: number;
};

export type AdminArticle = {
  id: string;
  code: string;
  category: { id: string; code: string; name_i18n: I18nMap };
  title_pinyin: string;
  title_i18n: I18nMap;
  status: 'draft' | 'published';
  sentence_count: number;
  published_at: string | null;
  updated_at: string;
  updated_by_name?: string | null;
  created_at?: string;
};

export type AdminListArticles = {
  items: AdminArticle[];
  pagination: { page: number; page_size: number; total: number };
  summary?: { total: number; draft: number; published: number };
};

export type AudioStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type AdminSentence = {
  id: string;
  article_id: string;
  seq_no: number;
  seq_label: string;
  pinyin: string;
  content_zh: string;
  content_en: string;
  content_vi: string;
  content_th: string;
  content_id: string;
  audio_status: AudioStatus;
  audio_url: string | null;
  audio_duration_ms: number | null;
};

export type AdminSearchResp = {
  summary: { articles_total: number; sentences_total: number; scope?: string };
  articles: Array<{
    id: string; code: string; category: { code: string; name_i18n: I18nMap };
    status: string; sentence_count?: number;
    title_pinyin: string;
    title_i18n?: I18nMap;
    title_i18n_html?: I18nMap;
    matched_field?: string;
    highlights?: Array<{ field: string; snippet: string }>;
    updated_at?: string; updated_by_name?: string | null;
  }>;
  sentences: Array<{
    id: string; seq_no: number; seq_label: string;
    article: { id: string; code: string; title_i18n: I18nMap };
    content_html?: string;
    matched_field?: string;
    highlights?: Array<{ field: string; snippet: string }>;
  }>;
  pagination: {
    page: number; page_size: number;
    total?: number;
    articles_pages?: number; sentences_pages?: number;
    has_next?: boolean;
  };
};

export function pickI18n(map: I18nMap | undefined, lang: Locale = 'zh'): string {
  if (!map) return '';
  return map[lang] || map.en || map.zh || Object.values(map).find(Boolean) || '';
}

export function fourDigit(n: number): string { return String(n).padStart(4, '0'); }
