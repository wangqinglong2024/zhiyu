import type { UILanguage } from '../types'

export function detectBrowserLanguage(): UILanguage {
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('vi')) return 'vi'
  return 'en'
}
