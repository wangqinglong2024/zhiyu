import { type FC, useState, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites } from '../hooks/use-favorites'
import { useFavoriteStore } from '../stores/favorite-store'
import { useLanguage } from '../../i18n/hooks/use-language'

interface FavoriteButtonProps {
  articleId: string
  isFavorited: boolean
  size?: number
  showLabel?: boolean
}

const LABELS: Record<string, Record<string, string>> = {
  zh: { save: '收藏', saved: '已收藏' },
  en: { save: 'Save', saved: 'Saved' },
  vi: { save: 'Lưu', saved: 'Đã lưu' },
}

export const FavoriteButton: FC<FavoriteButtonProps> = ({
  articleId, isFavorited: initialFavorited, size = 20, showLabel = false,
}) => {
  const { uiLanguage } = useLanguage()
  const { toggleFavorite } = useFavorites()
  const storeIsFavorited = useFavoriteStore(s => s.favorites.get(articleId))
  const isFavorited = storeIsFavorited ?? initialFavorited
  const [animating, setAnimating] = useState(false)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAnimating(true)
    try {
      await toggleFavorite(articleId)
    } catch {
      // Error toast handled by store
    } finally {
      setTimeout(() => setAnimating(false), 300)
    }
  }, [toggleFavorite, articleId])

  const labels = LABELS[uiLanguage] ?? LABELS.zh!

  return (
    <button
      className="flex items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
      onClick={handleClick}
      aria-label={isFavorited ? labels.saved : labels.save}
    >
      <Heart
        size={size}
        className={`transition-all duration-300
          ${isFavorited ? 'fill-[var(--color-rose)] text-[var(--color-rose)]' : 'text-[var(--color-text-tertiary)]'}
          ${animating
            ? isFavorited
              ? 'scale-130'
              : 'scale-80'
            : 'scale-100'}`}
        style={{
          transitionTimingFunction: isFavorited
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'ease-out',
        }}
      />
      {showLabel && (
        <span className={`text-xs ${isFavorited ? 'text-[var(--color-rose)]' : 'text-[var(--color-text-tertiary)]'}`}>
          {isFavorited ? labels.saved : labels.save}
        </span>
      )}
    </button>
  )
}

FavoriteButton.displayName = 'FavoriteButton'
