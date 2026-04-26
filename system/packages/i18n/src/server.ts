/**
 * Server-side translator. Lightweight, no react-i18next.
 *
 * Use:
 *   const t = makeT(parseAcceptLanguage(req.headers['accept-language']));
 *   t('common:errors.unauthorized', { who: 'guest' });
 *
 * Resolves nested keys with `:`/`.` separators and returns the key string
 * itself when the resource is missing (parity with i18next behaviour).
 */
import { IntlMessageFormat } from 'intl-messageformat';
import {
  DEFAULT_LOCALE,
  isUiLocale,
  parseAcceptLanguage,
  type Namespace,
  type UiLocale,
} from './index.js';
import { RESOURCES } from './resources.js';

function lookup(bag: Record<string, unknown> | undefined, path: string[]): string | undefined {
  let cur: unknown = bag;
  for (const seg of path) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export type ServerT = (key: string, vars?: Record<string, unknown>) => string;

export function makeT(lng: UiLocale | string | null | undefined): ServerT {
  const resolved: UiLocale = isUiLocale(lng) ? lng : parseAcceptLanguage(typeof lng === 'string' ? lng : null);
  return (key: string, vars?: Record<string, unknown>) => {
    const [nsRaw, restRaw] = key.includes(':') ? key.split(':', 2) : ['common', key];
    const ns = nsRaw as Namespace;
    const path = (restRaw ?? '').split('.');
    const primary = lookup(RESOURCES[resolved]?.[ns], path);
    const fallback = primary ?? lookup(RESOURCES[DEFAULT_LOCALE]?.[ns], path);
    if (!fallback) return key;
    if (!vars) return fallback;
    try {
      const fmt = new IntlMessageFormat(fallback, resolved);
      const out = fmt.format(vars);
      return Array.isArray(out) ? out.join('') : String(out ?? '');
    } catch {
      return fallback;
    }
  };
}

export { parseAcceptLanguage };
