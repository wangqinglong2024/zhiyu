#!/usr/bin/env tsx
/**
 * @zhiyu/i18n linter — best-effort scanner for hardcoded UI strings.
 *
 * Heuristics (no AST parser to keep the script self-contained):
 *   1) JSX text nodes containing CJK chars (>1) → must be wrapped in t().
 *   2) Latin words ≥3 chars between `>` and `<` that look like sentences.
 *   3) Tailwind directional pl-/pr-/ml-/mr- → must use ps-/pe-/ms-/me- (RTL safe).
 *
 * Exits non-zero with a summary on findings. Skips:
 *   - files in test/, dist/, node_modules/
 *   - files annotated `/* i18n-skip *​/`
 *   - the i18n package itself
 */
import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd(), '..', '..');
const APP_DIRS = ['apps/web/src', 'apps/admin/src'].map((p) => resolve(ROOT, p));
const FILE_EXT = new Set(['.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', 'build', '__tests__', 'test']);

const CJK = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]{2,}/;
const SENTENCE = /\b(?:[A-Z][a-z]{2,}\s+){1,}[A-Z]?[a-z]{2,}/;
const RTL_UNSAFE = /\b(?:pl|pr|ml|mr)-\d/;

interface Finding {
  file: string;
  line: number;
  rule: string;
  text: string;
}

async function walk(dir: string, out: string[]): Promise<void> {
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (FILE_EXT.has(extname(entry.name))) {
      out.push(full);
    }
  }
}

function scan(file: string): Finding[] {
  const findings: Finding[] = [];
  let src: string;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    return findings;
  }
  if (src.includes('i18n-skip-file')) return findings;
  const lines = src.split('\n');
  let inSkip = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/i18n-skip-start/.test(line)) inSkip = true;
    if (/i18n-skip-end/.test(line)) { inSkip = false; continue; }
    if (inSkip) continue;
    if (line.trim().startsWith('//')) continue;
    if (/i18n-skip-line/.test(line)) continue;
    // Detect JSX text >…<; conservative: must follow an opening tag character `>`
    // and precede `<` on the same line, and not be inside `t(`/`useT(`.
    const jsxText = line.match(/>([^<>{]{2,})</);
    if (jsxText) {
      const text = jsxText[1] ?? '';
      // ignore stuff that's all whitespace, punctuation, or short
      const stripped = text.trim();
      if (stripped && CJK.test(stripped)) {
        findings.push({ file, line: i + 1, rule: 'cjk-literal', text: stripped });
      } else if (stripped.length >= 8 && SENTENCE.test(stripped) && !/^[A-Z_]+$/.test(stripped)) {
        findings.push({ file, line: i + 1, rule: 'latin-sentence', text: stripped });
      }
    }
    // RTL-unsafe spacing
    if (RTL_UNSAFE.test(line) && line.includes('className')) {
      findings.push({ file, line: i + 1, rule: 'rtl-unsafe-spacing', text: line.trim().slice(0, 120) });
    }
  }
  return findings;
}

async function main(): Promise<void> {
  const files: string[] = [];
  for (const dir of APP_DIRS) await walk(dir, files);
  const allFindings: Finding[] = [];
  for (const f of files) allFindings.push(...scan(f));

  if (allFindings.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`[i18n:lint] OK · scanned ${files.length} files, 0 findings`);
    return;
  }

  const byRule = new Map<string, Finding[]>();
  for (const f of allFindings) {
    const list = byRule.get(f.rule) ?? [];
    list.push(f);
    byRule.set(f.rule, list);
  }

  for (const [rule, items] of byRule) {
    // eslint-disable-next-line no-console
    console.log(`\n[${rule}] ${items.length} findings`);
    for (const it of items.slice(0, 200)) {
      const rel = it.file.startsWith(ROOT + sep) ? it.file.slice(ROOT.length + 1) : it.file;
      // eslint-disable-next-line no-console
      console.log(`  ${rel}:${it.line}  ${JSON.stringify(it.text)}`);
    }
    if (items.length > 200) {
      // eslint-disable-next-line no-console
      console.log(`  …(${items.length - 200} more)`);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`\n[i18n:lint] FAIL · total ${allFindings.length} findings across ${files.length} files`);
  process.exitCode = 1;
}

void main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[i18n:lint] error:', err instanceof Error ? err.message : err);
  process.exitCode = 2;
});

void statSync; // keep import used in type-check tools
