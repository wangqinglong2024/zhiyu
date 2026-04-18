import type { FC } from 'react'
import { useLanguage } from '../../i18n/hooks/use-language'

interface LoadMoreIndicatorProps {
  isLoading: boolean
  hasMore: boolean
}

const END_LABELS: Record<string, string> = {
  zh: '已经到底啦~',
  en: 'No more articles',
  vi: 'Đã hết bài viết',
}

export const LoadMoreIndicator: FC<LoadMoreIndicatorProps> = ({ isLoading, hasMore }) => {
  const { uiLanguage } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--color-rose)]"
            style={{
              animation: 'bounce 0.6s infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (!hasMore) {
    return (
      <p className="text-center text-sm text-[var(--color-text-tertiary)] py-6">
        {END_LABELS[uiLanguage]}
      </p>
    )
  }

  return null
}

LoadMoreIndicator.displayName = 'LoadMoreIndicator'
