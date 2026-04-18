export type UILanguage = 'zh' | 'en' | 'vi'
export type LearningMode = 'pinyin_chinese' | 'chinese_only'
export type ExplanationLanguage = 'zh' | 'en' | 'vi'

export interface I18nContextValue {
  uiLanguage: UILanguage
  learningMode: LearningMode
  explanationLanguage: ExplanationLanguage
  explanationEnabled: boolean
  setUiLanguage: (lang: UILanguage) => void
  setLearningMode: (mode: LearningMode) => void
  setExplanationLanguage: (lang: ExplanationLanguage) => void
  translations: Record<string, Record<string, string>>
  isLoading: boolean
}
