/**
 * Per-language web-font loader.
 *
 * Strategy (ZY-04-03):
 *  - Maintain a manifest mapping UI locale → fonts to preload.
 *  - On `loadFontsFor(lng)` we inject one `<link rel=preload as=font>` per
 *    font URL that hasn't been requested yet, then a single `<style>` block
 *    declaring the @font-face rules. font-display: swap keeps fallback alive.
 *  - We dedupe via the data-zhiyu-font attribute on <link> and on <style>
 *    so repeated calls on language switch are no-ops.
 *  - Real woff2 binaries are NOT bundled here. URLs target `/fonts/<family>`
 *    served by the FE container (vite copies them from the package public
 *    dir at build time). When a binary is missing the browser silently falls
 *    through to the local() fallback declared in `packages/ui/styles/fonts.css`.
 */
import type { UiLocale } from './index.js';

export interface FontFaceSpec {
  family: string;
  weights: number[];
  url: string;
  unicodeRange?: string;
}

export const LOCALE_FONTS: Record<UiLocale, FontFaceSpec[]> = {
  en: [
    { family: 'Inter', weights: [400, 500, 700], url: '/fonts/inter/Inter-Variable.woff2' },
  ],
  vi: [
    { family: 'Inter', weights: [400, 500, 700], url: '/fonts/inter/Inter-Variable.woff2' },
    {
      family: 'Be Vietnam Pro',
      weights: [400, 500, 700],
      url: '/fonts/bevn/BeVietnamPro-Regular.woff2',
      unicodeRange: 'U+0100-024F, U+1E00-1EFF, U+0300-036F, U+0102, U+1EA0-1EF9, U+20AB',
    },
  ],
  th: [
    { family: 'Inter', weights: [400, 500, 700], url: '/fonts/inter/Inter-Variable.woff2' },
    {
      family: 'Noto Sans Thai',
      weights: [400, 500, 700],
      url: '/fonts/notothai/NotoSansThai-Regular.woff2',
      unicodeRange: 'U+0E00-0E7F',
    },
  ],
  id: [
    { family: 'Inter', weights: [400, 500, 700], url: '/fonts/inter/Inter-Variable.woff2' },
  ],
};

export const CONTENT_CJK_FONT: FontFaceSpec = {
  family: 'LXGW WenKai',
  weights: [400, 700],
  url: '/fonts/lxgw/LXGWWenKai-Regular.woff2',
  unicodeRange: 'U+4E00-9FFF, U+3000-303F, U+FF00-FFEF',
};

const STYLE_ID = 'zhiyu-fontfaces';
const PRELOAD_ATTR = 'data-zhiyu-preload';

function ensureStyleNode(): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;
  let node = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!node) {
    node = document.createElement('style');
    node.id = STYLE_ID;
    document.head.appendChild(node);
  }
  return node;
}

const seenUrls = new Set<string>();
const seenSpecs = new Set<string>();

function specKey(spec: FontFaceSpec): string {
  return `${spec.family}|${spec.weights.join(',')}|${spec.url}|${spec.unicodeRange ?? ''}`;
}

function specToCss(spec: FontFaceSpec): string {
  const weight = spec.weights.length > 1 ? `${spec.weights[0]} ${spec.weights[spec.weights.length - 1]}` : String(spec.weights[0]);
  const range = spec.unicodeRange ? `\n  unicode-range: ${spec.unicodeRange};` : '';
  return `@font-face {\n  font-family: '${spec.family}';\n  src: url('${spec.url}') format('woff2');\n  font-weight: ${weight};\n  font-display: swap;${range}\n}`;
}

function appendPreload(url: string): void {
  if (typeof document === 'undefined') return;
  if (seenUrls.has(url)) return;
  seenUrls.add(url);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = url;
  link.setAttribute(PRELOAD_ATTR, '1');
  document.head.appendChild(link);
}

/**
 * Asset gating: woff2 binaries are not bundled. Set
 * VITE_ENABLE_FONT_URLS=1 to opt-in to URL-based @font-face. Otherwise we
 * rely on the local() fallback declared in @zhiyu/ui/styles/fonts.css and
 * skip preload + URL injection — preventing 404 noise in the console.
 */
const ENABLE_URL_FONTS: boolean =
  typeof import.meta !== 'undefined' &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any)?.env?.VITE_ENABLE_FONT_URLS === '1';

export function loadFontsFor(lng: UiLocale): void {
  if (!ENABLE_URL_FONTS) {
    const live = typeof document !== 'undefined'
      ? document.getElementById('zhiyu-i18n-live') ?? createLiveRegion()
      : null;
    if (live) live.textContent = `lang:${lng}`;
    return;
  }
  const specs = LOCALE_FONTS[lng] ?? [];
  const style = ensureStyleNode();
  if (!style) return;
  let added = 0;
  for (const spec of specs) {
    const key = specKey(spec);
    if (seenSpecs.has(key)) continue;
    seenSpecs.add(key);
    appendPreload(spec.url);
    style.appendChild(document.createTextNode(`\n${specToCss(spec)}`));
    added++;
  }
  if (added > 0) {
    const live = document.getElementById('zhiyu-i18n-live') ?? createLiveRegion();
    live.textContent = `lang:${lng}`;
  }
}

export function loadCjkContentFont(): void {
  if (!ENABLE_URL_FONTS) return;
  const style = ensureStyleNode();
  if (!style) return;
  const key = specKey(CONTENT_CJK_FONT);
  if (seenSpecs.has(key)) return;
  seenSpecs.add(key);
  appendPreload(CONTENT_CJK_FONT.url);
  style.appendChild(document.createTextNode(`\n${specToCss(CONTENT_CJK_FONT)}`));
}

function createLiveRegion(): HTMLElement {
  const node = document.createElement('div');
  node.id = 'zhiyu-i18n-live';
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  node.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';
  document.body.appendChild(node);
  return node;
}
