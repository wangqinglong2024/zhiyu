/** 5 语言（G2 决策）。`zh` 默认。 */
export const LOCALES = ['zh', 'en', 'vi', 'th', 'id'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'zh';

export const LOCALE_LABEL: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
};
