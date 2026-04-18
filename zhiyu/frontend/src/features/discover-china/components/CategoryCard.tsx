import { type FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import type { Category } from '../types/discover-china.types'

interface CategoryCardProps {
  category: Category
}

export const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    navigate(`/discover/category/${category.id}`)
  }, [navigate, category.id])

  return (
    <button
      className="glass-card rounded-3xl overflow-hidden text-left w-full
        active:scale-[0.97] transition-transform duration-100"
      onClick={handleClick}
    >
      {/* Cover image */}
      <div className="aspect-[4/3] relative bg-[var(--bg-elevated)]">
        {category.coverUrl ? (
          <img
            src={category.coverUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-rose)]/20 to-[var(--color-sky)]/20" />
        )}
        {/* Article count badge */}
        <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5
          rounded-full bg-black/40 text-white text-xs backdrop-blur-sm">
          <FileText size={12} />
          {category.articleCount}
        </span>
      </div>

      {/* Text */}
      <div className="p-3">
        <h3 className="text-base font-semibold font-[var(--font-heading)] text-[var(--color-text-primary)] truncate">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
            {category.description}
          </p>
        )}
      </div>
    </button>
  )
}

CategoryCard.displayName = 'CategoryCard'
