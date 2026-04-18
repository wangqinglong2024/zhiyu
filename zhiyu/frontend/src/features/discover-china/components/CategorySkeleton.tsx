import type { FC } from 'react'

export const CategorySkeleton: FC = () => {
  return (
    <div className="min-h-screen px-4 pt-12 pb-4 animate-pulse">
      {/* Daily Quote skeleton */}
      <div className="glass-card p-6 mb-6 h-[180px] rounded-3xl" />

      {/* Category grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass-card rounded-3xl overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--color-text-tertiary)] opacity-10" />
            <div className="p-3">
              <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-20 mb-2 w-3/4" />
              <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

CategorySkeleton.displayName = 'CategorySkeleton'
