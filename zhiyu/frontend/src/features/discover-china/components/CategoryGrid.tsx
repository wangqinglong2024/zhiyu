import type { FC } from 'react'
import { useLoginWallContext } from '../../auth/contexts/LoginWallContext'
import { CategoryCard } from './CategoryCard'
import { LockedCategoryCard } from './LockedCategoryCard'
import type { Category } from '../types/discover-china.types'

interface CategoryGridProps {
  categories: Category[]
}

export const CategoryGrid: FC<CategoryGridProps> = ({ categories }) => {
  const { isAuthenticated } = useLoginWallContext()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((cat, i) => (
        <div
          key={cat.id}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {cat.isPublic || isAuthenticated ? (
            <CategoryCard category={cat} />
          ) : (
            <LockedCategoryCard category={cat} />
          )}
        </div>
      ))}
    </div>
  )
}

CategoryGrid.displayName = 'CategoryGrid'
