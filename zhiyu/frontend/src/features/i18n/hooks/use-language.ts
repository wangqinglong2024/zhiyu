import { useContext } from 'react'
import { I18nContext } from '../contexts/I18nContext'

export function useLanguage() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useLanguage must be used within I18nProvider')

  return {
    uiLanguage: ctx.uiLanguage,
    setUiLanguage: ctx.setUiLanguage,
    explanationLanguage: ctx.explanationLanguage,
    explanationEnabled: ctx.explanationEnabled,
    setExplanationLanguage: ctx.setExplanationLanguage,
  }
}
