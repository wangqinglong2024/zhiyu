import { type FC, type ReactNode, useState, useRef, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
  className?: string
}

export const PullToRefresh: FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 60,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return
    const container = containerRef.current
    if (container && container.scrollTop <= 0) {
      startY.current = e.touches[0]!.clientY
      pulling.current = true
    }
  }, [isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || isRefreshing) return
    const delta = e.touches[0]!.clientY - startY.current
    if (delta > 0) {
      // 阻尼效果
      const dampened = Math.min(delta * 0.5, 120)
      setPullDistance(dampened)
    }
  }, [isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      setPullDistance(threshold * 0.6)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, threshold, onRefresh])

  const showIndicator = pullDistance > 30

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 刷新指示器 */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{
          height: showIndicator ? pullDistance : 0,
          opacity: showIndicator ? 1 : 0,
          transform: `translateY(${showIndicator ? 0 : -20}px)`,
        }}
      >
        <RefreshCw
          size={20}
          className={`text-[var(--color-rose-primary)] ${
            isRefreshing || pullDistance >= threshold ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing ? undefined : `rotate(${Math.min(pullDistance / threshold, 1) * 180}deg)`,
          }}
        />
      </div>

      {/* 内容 */}
      <div style={{ transform: `translateY(${showIndicator && !isRefreshing ? Math.max(0, pullDistance - 30) * 0.3 : 0}px)` }}>
        {children}
      </div>
    </div>
  )
}

PullToRefresh.displayName = 'PullToRefresh'
