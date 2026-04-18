import { type FC, useState, useCallback } from 'react'
import { Share2, Loader } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'
import type { DailyQuote } from '../types/discover-china.types'

interface DailyQuoteCardProps {
  quote: DailyQuote
  onShare?: () => void
}

const OVERLINE: Record<string, string> = {
  zh: '✨ 每日金句',
  en: '✨ Daily Quote',
  vi: '✨ Câu nói hàng ngày',
}

export const DailyQuoteCard: FC<DailyQuoteCardProps> = ({ quote, onShare }) => {
  const { uiLanguage, explanationEnabled, explanationLanguage } = useLanguage()
  const [sharing, setSharing] = useState(false)

  const handleShare = useCallback(async () => {
    if (sharing) return
    setSharing(true)
    try {
      onShare?.()
    } finally {
      // Let the parent control when to reset
      setTimeout(() => setSharing(false), 300)
    }
  }, [sharing, onShare])

  // Determine which text to show based on user config
  const renderQuoteContent = () => {
    const lines: React.ReactElement[] = []

    // Always show Chinese quote
    lines.push(
      <p key="zh" className="text-lg font-medium text-[var(--color-text-primary)] leading-relaxed">
        {quote.quoteZh}
      </p>,
    )

    // Show pinyin (for non-zh UI users by default)
    if (quote.quotePinyin) {
      lines.push(
        <p key="pinyin" className="text-sm text-[var(--color-text-secondary)] opacity-60 mt-1">
          {quote.quotePinyin}
        </p>,
      )
    }

    // Source
    if (quote.sourceZh) {
      lines.push(
        <p key="source" className="text-sm text-[var(--color-amber)] mt-2">
          —— {quote.sourceZh}
        </p>,
      )
    }

    // Explanation language interpretation
    if (explanationEnabled) {
      const interpText = explanationLanguage === 'en'
        ? quote.interpretationEn
        : explanationLanguage === 'vi'
          ? quote.interpretationVi
          : quote.interpretationZh
      if (interpText) {
        lines.push(
          <p key="interp" className="text-sm text-[var(--color-text-secondary)] opacity-70 mt-2">
            {interpText}
          </p>,
        )
      }
    }

    return lines
  }

  return (
    <div className="glass-card rounded-3xl p-6 mb-6 relative overflow-hidden">
      {/* Background image */}
      {quote.bgImageUrl && (
        <img
          src={quote.bgImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10">
        {/* Overline */}
        <span className="text-[11px] font-medium tracking-wider uppercase text-[var(--color-amber)]">
          {OVERLINE[uiLanguage]}
        </span>

        {/* Quote content */}
        <div className="mt-3">
          {renderQuoteContent()}
        </div>

        {/* Share button */}
        <button
          className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center
            rounded-full glass-elevated text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)] transition-colors"
          onClick={handleShare}
          disabled={sharing}
          aria-label="Share"
        >
          {sharing ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <Share2 size={18} />
          )}
        </button>
      </div>
    </div>
  )
}

DailyQuoteCard.displayName = 'DailyQuoteCard'
