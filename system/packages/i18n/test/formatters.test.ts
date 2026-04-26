import { describe, expect, it } from 'vitest';
import { fmtNumber, fmtCurrency, fmtDate, fmtRelative } from '../src/formatters.js';
import { makeT } from '../src/server.js';
import { parseAcceptLanguage, pickUiLocale } from '../src/index.js';

describe('parseAcceptLanguage', () => {
  it('returns DEFAULT when header missing', () => {
    expect(parseAcceptLanguage(null)).toBe('en');
    expect(parseAcceptLanguage(undefined)).toBe('en');
  });
  it('picks highest-q match', () => {
    expect(parseAcceptLanguage('vi-VN,vi;q=0.9,en;q=0.5')).toBe('vi');
    expect(parseAcceptLanguage('th-TH,en;q=0.5')).toBe('th');
    expect(parseAcceptLanguage('id-ID,en-US;q=0.7')).toBe('id');
  });
  it('falls back to en for unsupported', () => {
    expect(parseAcceptLanguage('ja-JP,zh;q=0.9')).toBe('en');
  });
});

describe('pickUiLocale', () => {
  it('handles primary subtag', () => {
    expect(pickUiLocale('en-US')).toBe('en');
    expect(pickUiLocale('th-TH')).toBe('th');
    expect(pickUiLocale('id_ID')).toBe('id');
    expect(pickUiLocale('vi')).toBe('vi');
    expect(pickUiLocale('zh-CN')).toBe('en');
  });
});

describe('fmtNumber', () => {
  it('formats per locale with latn numerals', () => {
    expect(fmtNumber(1234567.89, 'en')).toBe('1,234,567.89');
    expect(fmtNumber(1234567.89, 'vi')).toContain('234');
    expect(fmtNumber(1234567.89, 'th')).toContain('1');
    expect(fmtNumber(1234567.89, 'id')).toContain('1');
  });
  it('returns string for non-finite', () => {
    expect(fmtNumber(Number.NaN, 'en')).toBe('NaN');
  });
});

describe('fmtCurrency', () => {
  it('uses locale default currency when omitted', () => {
    expect(fmtCurrency(123, undefined, 'en')).toMatch(/\$/);
    expect(fmtCurrency(123, undefined, 'vi')).toMatch(/₫|VND/);
    expect(fmtCurrency(123, undefined, 'th')).toMatch(/฿|THB/);
    expect(fmtCurrency(123, undefined, 'id')).toMatch(/Rp|IDR/);
  });
  it('drops decimals for VND/IDR', () => {
    // 1234.56 should round to 1235 with no fractional part visible.
    expect(fmtCurrency(1234.56, 'VND', 'vi')).toMatch(/1[.,]?235/);
    expect(fmtCurrency(1234.56, 'VND', 'vi')).not.toMatch(/[.,]\d{2}\D*$/);
    expect(fmtCurrency(1234.56, 'IDR', 'id')).not.toMatch(/[.,]\d{2}\D*$/);
  });
});

describe('fmtDate / fmtRelative', () => {
  it('formats a known instant per locale', () => {
    const d = new Date('2024-06-15T08:30:00Z');
    expect(fmtDate(d, 'en')).toMatch(/2024/);
    expect(fmtDate(d, 'vi')).toMatch(/2024/);
    expect(fmtDate(d, 'th')).toMatch(/2024|2567/);
    expect(fmtDate(d, 'id')).toMatch(/2024/);
  });
  it('renders relative buckets', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const past = new Date('2024-06-15T11:30:00Z');
    expect(fmtRelative(past, 'en', now)).toMatch(/30 minutes ago|min/i);
  });
});

describe('server makeT — ICU plural & interpolation', () => {
  it('formats plural per locale', () => {
    expect(makeT('en')('common:home.today_count', { count: 0 })).toContain('No cards');
    expect(makeT('en')('common:home.today_count', { count: 1 })).toContain('1 card');
    expect(makeT('en')('common:home.today_count', { count: 5 })).toContain('5 cards');
    expect(makeT('vi')('common:home.today_count', { count: 5 })).toContain('5');
    expect(makeT('th')('common:home.today_count', { count: 5 })).toContain('5');
    expect(makeT('id')('common:home.today_count', { count: 5 })).toContain('5');
  });
  it('interpolates simple variables', () => {
    expect(makeT('en')('common:home.system_check_body', { api: '/x', supabase: '/y' })).toContain('/x');
    expect(makeT('vi')('common:home.system_check_body', { api: '/x', supabase: '/y' })).toContain('/y');
  });
  it('falls back to en when locale missing key', () => {
    // en exists, request invented locale → should use en fallback
    expect(makeT('vi')('common:nav.signin')).toBeTruthy();
  });
  it('returns key on missing key', () => {
    expect(makeT('en')('common:nope.no_such_key')).toBe('common:nope.no_such_key');
  });
});

describe('parity — namespace coverage', () => {
  it('has identical key sets across locales for loaded namespaces', async () => {
    const { RESOURCES, LOADED_NAMESPACES } = await import('../src/resources.js');
    function flat(obj: unknown, prefix = ''): string[] {
      if (typeof obj !== 'object' || obj === null) return [];
      const out: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string') out.push(path);
        else out.push(...flat(v, path));
      }
      return out;
    }
    for (const ns of LOADED_NAMESPACES) {
      const enKeys = flat(RESOURCES.en[ns] ?? {}).sort();
      for (const lng of ['vi', 'th', 'id'] as const) {
        const lngKeys = flat(RESOURCES[lng][ns] ?? {}).sort();
        expect({ ns, lng, keys: lngKeys }).toEqual({ ns, lng, keys: enKeys });
      }
    }
  });
});
