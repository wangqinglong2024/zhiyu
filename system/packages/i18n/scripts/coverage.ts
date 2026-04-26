#!/usr/bin/env tsx
/**
 * @zhiyu/i18n key-coverage report.
 *
 * For each loaded namespace, compares key sets between en (source) and the
 * other UI locales (vi, th, id). Prints missing keys + a percentage.
 * Exits 0 always (non-blocking); CI gates on `i18n:lint` instead.
 */
import { RESOURCES, LOADED_NAMESPACES } from '../src/resources.js';
import { UI_LOCALES, DEFAULT_LOCALE, type UiLocale, type Namespace } from '../src/index.js';

function flatten(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.push(path);
    else out.push(...flatten(v, path));
  }
  return out;
}

interface Report {
  ns: Namespace;
  lng: UiLocale;
  total: number;
  present: number;
  missing: string[];
}

const reports: Report[] = [];
for (const ns of LOADED_NAMESPACES) {
  const enKeys = new Set(flatten(RESOURCES[DEFAULT_LOCALE][ns] ?? {}));
  for (const lng of UI_LOCALES) {
    if (lng === DEFAULT_LOCALE) continue;
    const lngKeys = new Set(flatten(RESOURCES[lng][ns] ?? {}));
    const missing: string[] = [];
    for (const k of enKeys) if (!lngKeys.has(k)) missing.push(k);
    reports.push({ ns, lng, total: enKeys.size, present: enKeys.size - missing.length, missing });
  }
}

let totalKeys = 0;
let totalPresent = 0;
// eslint-disable-next-line no-console
console.log('NS         LNG  COVERAGE  MISSING');
for (const r of reports) {
  totalKeys += r.total;
  totalPresent += r.present;
  const pct = r.total === 0 ? 100 : Math.round((r.present / r.total) * 100);
  // eslint-disable-next-line no-console
  console.log(`${r.ns.padEnd(10)} ${r.lng.padEnd(4)} ${String(pct).padStart(3)}%      ${r.missing.length}`);
}
const overall = totalKeys === 0 ? 100 : Math.round((totalPresent / totalKeys) * 100);
// eslint-disable-next-line no-console
console.log(`\nOverall: ${overall}% (${totalPresent}/${totalKeys})`);
for (const r of reports.filter((r) => r.missing.length > 0)) {
  // eslint-disable-next-line no-console
  console.log(`\n${r.ns}:${r.lng} missing (${r.missing.length}):`);
  for (const k of r.missing) {
    // eslint-disable-next-line no-console
    console.log(`  - ${k}`);
  }
}
