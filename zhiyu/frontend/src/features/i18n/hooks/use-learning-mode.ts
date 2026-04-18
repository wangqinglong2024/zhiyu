import { useContext } from 'react'
import { I18nContext } from '../contexts/I18nContext'

export function useLearningMode() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useLearningMode must be used within I18nProvider')

  return {
    learningMode: ctx.learningMode,
    setLearningMode: ctx.setLearningMode,
  }
}
