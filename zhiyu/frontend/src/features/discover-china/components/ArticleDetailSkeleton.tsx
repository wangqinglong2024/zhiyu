import type { FC } from 'react'

export const ArticleDetailSkeleton: FC = () => {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="sticky top-0 z-30 h-14 glass-elevated" />
      <div className="px-4 pt-4">
        {/* Title */}
        <div className="h-7 rounded bg-[var(--color-text-tertiary)] opacity-20 w-4/5 mb-2" />
        <div className="h-5 rounded bg-[var(--color-text-tertiary)] opacity-10 w-3/5 mb-4" />
        {/* Meta */}
        <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-2/5 mb-8" />
        {/* Content paragraphs */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-full mb-2" />
            <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-15 w-full mb-2" />
            <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-15 w-4/5 mb-2" />
            <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

ArticleDetailSkeleton.displayName = 'ArticleDetailSkeleton'
