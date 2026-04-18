/**
 * 模板字符串插值
 * format('Hello, {name}!', { name: '张三' }) → 'Hello, 张三!'
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = params[key]
    return val !== undefined ? escapeHtml(String(val)) : `{${key}}`
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
