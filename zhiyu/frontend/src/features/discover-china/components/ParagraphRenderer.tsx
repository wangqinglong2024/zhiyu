import type { FC } from 'react'
import { useLanguage } from '../../i18n/hooks/use-language'
import { useLearningMode } from '../../i18n/hooks/use-learning-mode'

interface ParagraphRendererProps {
  /** Chinese paragraph text */
  zhText: string
  /** Pinyin for the paragraph (if available) */
  pinyinText?: string
  /** Translations keyed by locale (en, vi, etc.) */
  localeTexts?: Record<string, string>
  /** Base font size for Chinese text */
  fontSize: number
}

/**
 * 段落渲染器 — 根据用户多语言配置动态渲染
 *
 * 5 种配置组合:
 *  1. pinyin_chinese + explanation ON → 拼音行 + 中文行 + 解释语言行
 *  2. pinyin_chinese + explanation OFF → 拼音行 + 中文行
 *  3. chinese_only + explanation ON → 中文行 + 解释语言行
 *  4. chinese_only + explanation OFF → 中文行
 *  5. uiLanguage=zh → 自动关闭解释语言 → 拼音行(可选) + 中文行
 */
export const ParagraphRenderer: FC<ParagraphRendererProps> = ({
  zhText, pinyinText, localeTexts, fontSize,
}) => {
  const { explanationEnabled, explanationLanguage } = useLanguage()
  const { learningMode } = useLearningMode()
  const showPinyin = learningMode === 'pinyin_chinese' && !!pinyinText

  return (
    <div className="mb-6">
      {/* Pinyin line */}
      {showPinyin && (
        <p
          className="text-[var(--color-text-secondary)] opacity-60 leading-relaxed"
          style={{ fontSize: `${fontSize - 4}px`, lineHeight: 1.5, marginBottom: '4px' }}
        >
          {pinyinText}
        </p>
      )}

      {/* Chinese line */}
      <p
        className="text-[var(--color-text-primary)] leading-relaxed"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
      >
        {zhText}
      </p>

      {/* Explanation language line */}
      {explanationEnabled && localeTexts?.[explanationLanguage] && (
        <p
          className="text-[var(--color-text-secondary)] opacity-70 leading-relaxed"
          style={{ fontSize: `${fontSize - 2}px`, lineHeight: 1.6, marginTop: '4px' }}
        >
          {localeTexts[explanationLanguage]}
        </p>
      )}
    </div>
  )
}

ParagraphRenderer.displayName = 'ParagraphRenderer'
