/**
 * Inline FOUC-prevention script. Embed this **synchronously** in every
 * app's index.html `<head>`, before any external CSS, so the html element
 * gains `data-theme` before the first paint.
 *
 * Keep this string short — it is parsed inline.
 */
export const THEME_INLINE_SCRIPT = `
(function(){try{
  var k='zhiyu:theme';
  var s=localStorage.getItem(k);
  var m=(s==='light'||s==='dark'||s==='system')?s:'system';
  var d=m==='dark'||(m==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  var r=document.documentElement;
  r.setAttribute('data-theme',d?'dark':'light');
  if(d)r.classList.add('dark');
  r.style.colorScheme=d?'dark':'light';
}catch(_){}})();
`.trim();

/**
 * Base href for index.html `<head>`:
 * `<script>${themeInlineScriptHtml}</script>`
 */
export const themeInlineScriptHtml = THEME_INLINE_SCRIPT;
