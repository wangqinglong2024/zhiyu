import type { FC } from 'react'

export const ArticleListSkeleton: FC = () => {
  return (
    <div className="animate-pulse">
      {/* Cover skeleton */}
      <div className="aspect-[21/9] rounded-3xl bg-[var(--color-text-tertiary)] opacity-10 mb-4" />

      {/* Article card skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-card rounded-3xl p-3 flex gap-3 mb-3">
          <div className="w-[100px] h-[75px] rounded-xl bg-[var(--color-text-tertiary)] opacity-10 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-20 mb-2 w-4/5" />
            <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-3/5 mb-3" />
            <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

ArticleListSkeleton.displayName = 'ArticleListSkeleton'
