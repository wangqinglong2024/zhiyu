import type { FC } from 'react'

interface GlobalLoadingProps {
  rows?: number
  type?: 'card' | 'list' | 'grid'
}

export const GlobalLoading: FC<GlobalLoadingProps> = ({ rows = 4, type = 'list' }) => {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className="p-4">
        <div className="rounded-2xl skeleton-shimmer h-48 mb-4" />
        <div className="space-y-3">
          <div className="h-5 rounded skeleton-shimmer w-2/3" />
          <div className="h-4 rounded skeleton-shimmer w-full" />
          <div className="h-4 rounded skeleton-shimmer w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded skeleton-shimmer w-3/4" />
            <div className="h-3 rounded skeleton-shimmer w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

GlobalLoading.displayName = 'GlobalLoading'
