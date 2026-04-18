import { type FC, useState, useCallback } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'
import { useCategories } from '../hooks/use-categories'
import { useDailyQuote } from '../hooks/use-daily-quote'
import { DailyQuoteCard } from '../components/DailyQuoteCard'
import { CategoryGrid } from '../components/CategoryGrid'
import { CategorySkeleton } from '../components/CategorySkeleton'
import { EmptyState } from '../../../core/components/states/EmptyState'
import { SharePreviewSheet } from '../components/share/SharePreviewSheet'
import { generateQuoteImage } from '../utils/canvas-share'

const TITLES: Record<string, string> = {
  zh: '发现中国',
  en: 'Discover China',
  vi: 'Khám phá Trung Quốc',
}

const ERROR_TITLES: Record<string, string> = {
  zh: '网络不给力',
  en: 'Network Error',
  vi: 'Lỗi mạng',
}

const RETRY_LABELS: Record<string, string> = {
  zh: '重试',
  en: 'Retry',
  vi: 'Thử lại',
}

const EMPTY_TITLES: Record<string, string> = {
  zh: '内容正在准备中',
  en: 'Content is being prepared',
  vi: 'Nội dung đang được chuẩn bị',
}

const OFFLINE_MSG: Record<string, string> = {
  zh: '当前处于离线状态，显示缓存数据',
  en: 'You are offline, showing cached data',
  vi: 'Bạn đang ngoại tuyến, hiển thị dữ liệu đã lưu',
}

export const DiscoverChinaPage: FC = () => {
  const { uiLanguage } = useLanguage()
  const locale = uiLanguage
  const { categories, isLoading: catLoading, error: catError, refetch: refetchCat } = useCategories(locale)
  const { quote, isLoading: quoteLoading, error: quoteError } = useDailyQuote()
  const [isOffline] = useState(() => !navigator.onLine)

  // Share state
  const [shareImage, setShareImage] = useState<Blob | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const handleQuoteShare = useCallback(async () => {
    if (!quote) return
    try {
      const blob = await generateQuoteImage(quote)
      setShareImage(blob)
      setShareOpen(true)
    } catch {
      // Error handling via toast in parent
    }
  }, [quote])

  // Loading state
  if (catLoading && !categories.length) {
    return <CategorySkeleton />
  }

  // Error state (categories failed, no cache)
  if (catError && !categories.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          {ERROR_TITLES[locale]}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 text-center">{catError}</p>
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-full
            bg-[var(--color-rose)] text-white font-medium text-sm"
          onClick={refetchCat}
        >
          <RefreshCw size={16} />
          {RETRY_LABELS[locale]}
        </button>
      </div>
    )
  }

  // Empty state
  if (!catLoading && categories.length === 0) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6">
          {TITLES[locale]}
        </h1>
        <EmptyState title={EMPTY_TITLES[locale]} />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-4">
      {/* Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-2 px-4 py-2 mb-4 rounded-xl
          bg-[var(--color-amber)]/10 text-[var(--color-amber)] text-sm">
          <WifiOff size={16} />
          {OFFLINE_MSG[locale]}
        </div>
      )}

      <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6 text-[var(--color-text-primary)]">
        {TITLES[locale]}
      </h1>

      {/* Daily Quote Card (partial load: show skeleton if quote failed) */}
      {quoteLoading ? (
        <div className="glass-card rounded-3xl p-6 mb-6 h-[180px] animate-pulse" />
      ) : quote ? (
        <DailyQuoteCard quote={quote} onShare={handleQuoteShare} />
      ) : quoteError ? (
        <div className="glass-card rounded-3xl p-6 mb-6 h-[120px] animate-pulse opacity-50" />
      ) : null}

      {/* Category Grid */}
      <CategoryGrid categories={categories} />

      {/* Share Preview Sheet */}
      {shareOpen && shareImage && (
        <SharePreviewSheet
          imageBlob={shareImage}
          title={quote?.quoteZh || ''}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}

DiscoverChinaPage.displayName = 'DiscoverChinaPage'
