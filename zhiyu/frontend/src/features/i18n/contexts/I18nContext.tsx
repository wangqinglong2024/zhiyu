import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UILanguage, LearningMode, ExplanationLanguage, I18nContextValue } from '../types'
import { detectBrowserLanguage } from '../utils/detect-language'
import { fetchTranslations } from '../services/i18n-service'

export const I18nContext = createContext<I18nContextValue | null>(null)

const LANG_KEY = 'ui_language'
const MODE_KEY = 'learning_mode'
const EXPL_KEY = 'explanation_language'

function getSavedLang(): UILanguage {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'zh' || saved === 'en' || saved === 'vi') return saved
  return detectBrowserLanguage()
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUiLangState] = useState<UILanguage>(getSavedLang)
  const [learningMode, setLearningModeState] = useState<LearningMode>(() => {
    const saved = localStorage.getItem(MODE_KEY)
    return saved === 'chinese_only' ? 'chinese_only' : 'pinyin_chinese'
  })
  const [explanationLanguage, setExplLangState] = useState<ExplanationLanguage>(() => {
    const saved = localStorage.getItem(EXPL_KEY)
    if (saved === 'zh' || saved === 'en' || saved === 'vi') return saved
    return getSavedLang()
  })
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})
  const [isLoading, setIsLoading] = useState(true)

  // 联动规则：UI=zh 时解释语言强制 zh
  const explanationEnabled = uiLanguage !== 'zh'

  const setUiLanguage = useCallback((lang: UILanguage) => {
    setUiLangState(lang)
    localStorage.setItem(LANG_KEY, lang)
    // 联动：UI=zh → 解释语言=zh；UI=en/vi → 解释语言跟随
    setExplLangState(lang)
    localStorage.setItem(EXPL_KEY, lang)
  }, [])

  const setLearningMode = useCallback((mode: LearningMode) => {
    setLearningModeState(mode)
    localStorage.setItem(MODE_KEY, mode)
  }, [])

  const setExplanationLanguage = useCallback((lang: ExplanationLanguage) => {
    if (uiLanguage === 'zh') return // zh 模式禁用切换
    setExplLangState(lang)
    localStorage.setItem(EXPL_KEY, lang)
  }, [uiLanguage])

  // 加载语言包
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchTranslations(uiLanguage)
      .then(data => {
        if (!cancelled) setTranslations(data)
      })
      .catch(err => {
        console.warn('Failed to load translations:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [uiLanguage])

  // 设置 html lang 属性
  useEffect(() => {
    document.documentElement.lang = uiLanguage === 'zh' ? 'zh-CN' : uiLanguage
  }, [uiLanguage])

  return (
    <I18nContext.Provider value={{
      uiLanguage,
      learningMode,
      explanationLanguage,
      explanationEnabled,
      setUiLanguage,
      setLearningMode,
      setExplanationLanguage,
      translations,
      isLoading,
    }}>
      {children}
    </I18nContext.Provider>
  )
}
