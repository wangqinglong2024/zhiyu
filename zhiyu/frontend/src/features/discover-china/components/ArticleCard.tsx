import type { FC } from 'react'
import { Eye } from 'lucide-react'
import type { ArticleListItem } from '../types/discover-china.types'

interface ArticleCardProps {
  article: ArticleListItem
  onClick?: () => void
  favoriteSlot?: React.ReactNode
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export const ArticleCard: FC<ArticleCardProps> = ({ article, onClick, favoriteSlot }) => {
  return (
    <button
      className="glass-card rounded-3xl p-3 w-full flex gap-3 text-left
        active:scale-[0.97] transition-transform duration-100"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-[100px] h-[75px] flex-shrink-0 rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-rose)]/10 to-[var(--color-sky)]/10" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug">
          {article.title}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
            {article.publishedAt && (
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            )}
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {formatCount(article.viewCount)}
            </span>
          </div>

          {/* Favorite button slot */}
          {favoriteSlot && (
            <div onClick={(e) => e.stopPropagation()}>
              {favoriteSlot}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

ArticleCard.displayName = 'ArticleCard'
