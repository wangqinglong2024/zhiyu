import { useContext, useCallback } from 'react'
import { I18nContext } from '../contexts/I18nContext'
import { interpolate } from '../utils/format'

export function useTranslation(namespace?: string) {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // key 格式: 'namespace.key' 或直接 'key'（使用默认 namespace）
    let ns: string
    let actualKey: string

    const dotIdx = key.indexOf('.')
    if (namespace) {
      ns = namespace
      actualKey = key
    } else if (dotIdx > 0) {
      ns = key.substring(0, dotIdx)
      actualKey = key.substring(dotIdx + 1)
    } else {
      ns = 'common'
      actualKey = key
    }

    const nsData = ctx.translations[ns]
    if (!nsData || !nsData[actualKey]) {
      // 开发模式醒目提示
      if (import.meta.env.DEV) {
        return `⚠️[${ns}.${actualKey}]`
      }
      return key
    }

    return interpolate(nsData[actualKey] ?? key, params)
  }, [ctx.translations, namespace])

  return {
    t,
    lang: ctx.uiLanguage,
    setLang: ctx.setUiLanguage,
    learningMode: ctx.learningMode,
    setLearningMode: ctx.setLearningMode,
    isLoading: ctx.isLoading,
  }
}
