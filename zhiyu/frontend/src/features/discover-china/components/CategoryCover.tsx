import type { FC } from 'react'
import type { Category } from '../types/discover-china.types'

interface CategoryCoverProps {
  category: Category
}

export const CategoryCover: FC<CategoryCoverProps> = ({ category }) => {
  return (
    <div className="relative rounded-3xl overflow-hidden mb-4">
      {/* Cover image */}
      <div className="aspect-[21/9] bg-[var(--bg-elevated)]">
        {category.coverUrl ? (
          <img
            src={category.coverUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-rose)]/20 to-[var(--color-sky)]/20" />
        )}
      </div>

      {/* Overlay info */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <h2 className="text-xl font-bold text-white font-[var(--font-heading)]">
          {category.name}
        </h2>
        {category.description && (
          <p className="text-sm text-white/80 mt-1 line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
    </div>
  )
}

CategoryCover.displayName = 'CategoryCover'
