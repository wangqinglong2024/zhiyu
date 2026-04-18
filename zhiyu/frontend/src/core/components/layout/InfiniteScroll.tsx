import { type FC, type ReactNode, useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  loader?: ReactNode
  endMessage?: ReactNode
  children: ReactNode
  className?: string
}

export const InfiniteScroll: FC<InfiniteScrollProps> = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  loader,
  endMessage,
  children,
  className = '',
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const lastCallRef = useRef(0)

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0]
    if (!entry?.isIntersecting || isLoading || !hasMore) return

    // 500ms 节流
    const now = Date.now()
    if (now - lastCallRef.current < 500) return
    lastCallRef.current = now

    onLoadMore()
  }, [isLoading, hasMore, onLoadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: `0px 0px ${threshold}px 0px`,
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleIntersect, threshold])

  return (
    <div className={className}>
      {children}

      {/* 触底哨兵 */}
      <div ref={sentinelRef} className="h-px" />

      {/* 加载中 */}
      {isLoading && (
        <div className="flex justify-center py-4">
          {loader || <Loader2 size={20} className="animate-spin text-[var(--color-rose-primary)]" />}
        </div>
      )}

      {/* 没有更多 */}
      {!hasMore && !isLoading && (
        <div className="text-center py-6 text-sm text-[var(--text-tertiary)]">
          {endMessage || '没有更多了'}
        </div>
      )}
    </div>
  )
}

InfiniteScroll.displayName = 'InfiniteScroll'
