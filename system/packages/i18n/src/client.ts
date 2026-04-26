/**
 * Browser-side i18next instance + React hook helpers.
 *
 * - Loads resources eagerly from `./resources.ts`.
 * - Persists choice in localStorage under `zhiyu:lng`.
 * - Syncs `<html lang>` and `<html dir>` on every change.
 * - Exposes `useT()` re-export for convenience.
 *
 * Note: we deliberately do NOT use i18next-icu here because importing it via
 * Vite + tailwind-merge has interop quirks with v23. We hand-route ICU through
 * a custom formatter built on `intl-messageformat` (see ./formatters.ts).
 */
import i18next, { type i18n as I18nInstance, type PostProcessorModule } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { IntlMessageFormat } from 'intl-messageformat';

import {
  DEFAULT_LOCALE,
  LOCALE_TO_DIR,
  LOCALE_TO_HTML_LANG,
  NAMESPACES,
  UI_LOCALES,
  isUiLocale,
  pickUiLocale,
  type Namespace,
  type UiLocale,
} from './index.js';
import { RESOURCES } from './resources.js';

const LS_KEY = 'zhiyu:lng';

function detectInitialLocale(): UiLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  // Highest priority: ?lang= query (deep-link / smoke tests).
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('lang');
    if (q && isUiLocale(q)) return q;
  } catch {
    /* ignore malformed URLs */
  }
  try {
    const stored = window.localStorage.getItem(LS_KEY);
    if (stored && isUiLocale(stored)) return stored;
  } catch {
    /* localStorage may be disabled (private mode) */
  }
  const navTags = (navigator.languages?.length ? navigator.languages : [navigator.language]) ?? [];
  for (const tag of navTags) {
    const matched = pickUiLocale(tag);
    if (matched !== DEFAULT_LOCALE || (tag ?? '').toLowerCase().startsWith('en')) return matched;
  }
  return DEFAULT_LOCALE;
}

let initialised = false;
let activeInstance: I18nInstance | null = null;

export function getI18n(): I18nInstance {
  if (initialised && activeInstance) return activeInstance;
  const resources = Object.fromEntries(
    UI_LOCALES.map((lng) => [lng, RESOURCES[lng]]),
  ) as Record<UiLocale, Record<Namespace, Record<string, unknown>>>;

  const inst = i18next.createInstance();
  const icuPostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'icu',
    process: (value, _key, options, translator) => {
      if (typeof value !== 'string' || !value.includes('{')) return value;
      const lng = (options as { lng?: string })?.lng ?? translator?.language ?? DEFAULT_LOCALE;
      try {
        const fmt = new IntlMessageFormat(value, lng);
        const out = fmt.format(options as Record<string, unknown>);
        return Array.isArray(out) ? out.join('') : String(out ?? '');
      } catch {
        return value;
      }
    },
  };
  void inst.use(initReactI18next).use(icuPostProcessor).init({
    resources,
    lng: detectInitialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: UI_LOCALES as unknown as string[],
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false, prefix: '\u0001', suffix: '\u0002' },
    postProcess: ['icu'],
    returnNull: false,
    saveMissing: false,
    missingKeyHandler: (lngs, ns, key) => {
      // Only warn in dev (vite sets DEV via import.meta.env)
      if (typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing key '${ns}:${key}' for ${String(lngs)}`);
      }
    },
  });

  // Legacy ICU formatter exposed on `t('k', { val, format: 'icu' })` for callers
  // that prefer i18next's own formatter pipeline.
  inst.services.formatter?.add('icu', (value, lng, options) => {
    if (typeof value !== 'string') return String(value);
    try {
      const fmt = new IntlMessageFormat(value, lng ?? DEFAULT_LOCALE);
      const result = fmt.format(options as Record<string, unknown>);
      return Array.isArray(result) ? result.join('') : String(result ?? '');
    } catch {
      return value;
    }
  });

  activeInstance = inst;
  initialised = true;
  syncHtmlAttrs(inst.language as UiLocale);
  inst.on('languageChanged', (lng) => {
    if (isUiLocale(lng)) {
      syncHtmlAttrs(lng);
      try {
        window.localStorage.setItem(LS_KEY, lng);
      } catch {
        /* ignore */
      }
    }
  });
  return inst;
}

function syncHtmlAttrs(lng: UiLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', LOCALE_TO_HTML_LANG[lng]);
  document.documentElement.setAttribute('dir', LOCALE_TO_DIR[lng]);
}

export async function changeLocale(next: UiLocale): Promise<void> {
  const inst = getI18n();
  await inst.changeLanguage(next);
}

export function getCurrentLocale(): UiLocale {
  const inst = activeInstance ?? getI18n();
  const lng = inst.language;
  return isUiLocale(lng) ? lng : DEFAULT_LOCALE;
}

/**
 * Apply ICU formatting to a raw template + variables.
 * Useful in code paths that don't go through i18next (e.g. building telemetry
 * messages or admin previews).
 */
export function formatIcu(template: string, vars: Record<string, unknown>, lng: UiLocale = getCurrentLocale()): string {
  const fmt = new IntlMessageFormat(template, lng);
  const out = fmt.format(vars);
  return Array.isArray(out) ? out.join('') : String(out ?? '');
}

export { useTranslation, I18nextProvider } from 'react-i18next';
export const useT = useTranslation;
