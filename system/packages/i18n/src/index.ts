/**
 * @zhiyu/i18n — shared i18n constants & types.
 *
 * UI locales (per PRD/E04 epic): en (default) / vi / th / id.
 * `zh-CN` is content origin only — never offered as UI language.
 *
 * NB: keep this file dependency-free so it can be imported in workers and
 * server contexts where react / i18next are not present.
 */

export const UI_LOCALES = ['en', 'vi', 'th', 'id'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const CONTENT_LOCALES = [...UI_LOCALES, 'zh-CN'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export const DEFAULT_LOCALE: UiLocale = 'en';
export const FALLBACK_CONTENT_LOCALE: ContentLocale = 'en';

export const NAMESPACES = [
  'common',
  'auth',
  'me',
  'discover',
  'courses',
  'games',
  'novels',
  'payment',
  'referral',
  'customer',
  'admin',
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const LOCALE_TO_HTML_LANG: Record<UiLocale, string> = {
  en: 'en',
  vi: 'vi',
  th: 'th',
  id: 'id',
};

export const LOCALE_TO_DIR: Record<UiLocale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  vi: 'ltr',
  th: 'ltr',
  id: 'ltr',
};

export const LOCALE_LABEL: Record<UiLocale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
};

export const LOCALE_DEFAULT_CURRENCY: Record<UiLocale, 'USD' | 'VND' | 'THB' | 'IDR'> = {
  en: 'USD',
  vi: 'VND',
  th: 'THB',
  id: 'IDR',
};

export function isUiLocale(value: unknown): value is UiLocale {
  return typeof value === 'string' && (UI_LOCALES as readonly string[]).includes(value);
}

export function pickUiLocale(value: string | null | undefined): UiLocale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase();
  // exact tag
  const exact = (UI_LOCALES as readonly string[]).find((l) => l === lower);
  if (exact) return exact as UiLocale;
  // primary subtag (e.g. "en-US" → "en")
  const primary = lower.split(/[-_]/)[0];
  const match = (UI_LOCALES as readonly string[]).find((l) => l === primary);
  return (match ?? DEFAULT_LOCALE) as UiLocale;
}

/**
 * Parse RFC-5646 quality-weighted Accept-Language and return the best match.
 * Always returns a known UI locale (falls back to DEFAULT_LOCALE).
 */
export function parseAcceptLanguage(header: string | null | undefined): UiLocale {
  if (!header) return DEFAULT_LOCALE;
  const items = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: (tag ?? '').toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((it) => it.tag && it.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const it of items) {
    const matched = pickUiLocale(it.tag);
    if (matched !== DEFAULT_LOCALE || it.tag?.startsWith('en')) return matched;
  }
  return DEFAULT_LOCALE;
}
