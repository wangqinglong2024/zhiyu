/**
 * Intl helpers: number / currency / date / relative time.
 *
 * - Cache `Intl.*Format` instances per (locale, options-key) — `Intl.*Format`
 *   constructors are not cheap.
 * - Force `latn` numbering for ar/ckb/fa locales (per ZY-04-02 spec) when we
 *   eventually onboard them; current 4-locale set is unaffected.
 */
import {
  DEFAULT_LOCALE,
  LOCALE_DEFAULT_CURRENCY,
  isUiLocale,
  type UiLocale,
} from './index.js';

const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();
const relativeCache = new Map<string, Intl.RelativeTimeFormat>();

function cacheKey(prefix: string, lng: string, opts: unknown): string {
  return `${prefix}|${lng}|${JSON.stringify(opts ?? {})}`;
}

function nf(lng: UiLocale, opts?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = cacheKey('n', lng, opts);
  let inst = numberCache.get(key);
  if (!inst) {
    inst = new Intl.NumberFormat(lng, { numberingSystem: 'latn', ...opts });
    numberCache.set(key, inst);
  }
  return inst;
}

function df(lng: UiLocale, opts?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = cacheKey('d', lng, opts);
  let inst = dateCache.get(key);
  if (!inst) {
    inst = new Intl.DateTimeFormat(lng, { numberingSystem: 'latn', ...opts });
    dateCache.set(key, inst);
  }
  return inst;
}

function rf(lng: UiLocale, opts?: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
  const key = cacheKey('r', lng, opts);
  let inst = relativeCache.get(key);
  if (!inst) {
    inst = new Intl.RelativeTimeFormat(lng, { numeric: 'auto', ...opts });
    relativeCache.set(key, inst);
  }
  return inst;
}

function safe(lng: UiLocale | string | null | undefined): UiLocale {
  return isUiLocale(lng) ? lng : DEFAULT_LOCALE;
}

export function fmtNumber(value: number, lng?: UiLocale | string, opts?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(value)) return String(value);
  return nf(safe(lng), opts).format(value);
}

export type Currency = 'USD' | 'VND' | 'THB' | 'IDR' | 'CNY' | 'EUR' | 'JPY';

export function fmtCurrency(value: number, currency?: Currency, lng?: UiLocale | string): string {
  const lc = safe(lng);
  const code: Currency = currency ?? LOCALE_DEFAULT_CURRENCY[lc];
  return nf(lc, {
    style: 'currency',
    currency: code,
    // VND/IDR have no minor units in practice; keep two for USD/THB/CNY.
    maximumFractionDigits: code === 'VND' || code === 'IDR' ? 0 : 2,
  }).format(value);
}

export function fmtDate(input: Date | number | string, lng?: UiLocale | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return df(safe(lng), opts ?? { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
}

export function fmtDateTime(input: Date | number | string, lng?: UiLocale | string): string {
  return fmtDate(input, lng, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const RELATIVE_BUCKETS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600 * 1000],
  ['month', 30 * 24 * 3600 * 1000],
  ['week', 7 * 24 * 3600 * 1000],
  ['day', 24 * 3600 * 1000],
  ['hour', 3600 * 1000],
  ['minute', 60 * 1000],
  ['second', 1000],
];

export function fmtRelative(input: Date | number | string, lng?: UiLocale | string, now: Date = new Date()): string {
  const target = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(target.getTime())) return '';
  const diffMs = target.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  for (const [unit, ms] of RELATIVE_BUCKETS) {
    if (abs >= ms || unit === 'second') {
      return rf(safe(lng)).format(Math.round(diffMs / ms), unit);
    }
  }
  return rf(safe(lng)).format(0, 'second');
}
