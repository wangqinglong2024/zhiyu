import { type FC } from 'react'
import { Eye, Heart, Calendar } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'
import { FavoriteButton } from './FavoriteButton'

interface ArticleHeaderProps {
  titleZh: string
  titleLocale?: string | null
  viewCount: number
  favoriteCount: number
  isFavorited: boolean
  articleId: string
  publishedAt: string | null
  onShare?: () => void
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export const ArticleHeader: FC<ArticleHeaderProps> = ({
  titleZh, titleLocale, viewCount, favoriteCount, isFavorited, articleId, publishedAt,
}) => {
  const { uiLanguage, explanationEnabled } = useLanguage()

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-[var(--font-heading)] leading-tight">
        {titleZh}
      </h1>

      {/* Locale title */}
      {explanationEnabled && titleLocale && (
        <h2 className="text-base text-[var(--color-text-secondary)] mt-1">
          {titleLocale}
        </h2>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-tertiary)]">
        {publishedAt && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(publishedAt).toLocaleDateString(uiLanguage === 'zh' ? 'zh-CN' : uiLanguage)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {formatCount(viewCount)}
        </span>
        <span className="flex items-center gap-1">
          <Heart size={12} />
          {formatCount(favoriteCount)}
        </span>
        <div className="ml-auto">
          <FavoriteButton articleId={articleId} isFavorited={isFavorited} size={22} showLabel />
        </div>
      </div>
    </div>
  )
}

ArticleHeader.displayName = 'ArticleHeader'
