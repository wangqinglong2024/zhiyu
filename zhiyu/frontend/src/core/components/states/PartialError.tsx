import type { FC, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface PartialErrorProps {
  message?: string
  onRetry?: () => void
  children?: ReactNode
}

export const PartialError: FC<PartialErrorProps> = ({
  message = '加载失败',
  onRetry,
}) => {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <span className="text-sm text-[var(--color-text-secondary)]">{message}</span>
      {onRetry && (
        <button
          className="flex items-center gap-1 text-sm text-[var(--color-accent-rose)] font-medium"
          onClick={onRetry}
        >
          <RefreshCw size={14} />
          重试
        </button>
      )}
    </div>
  )
}

PartialError.displayName = 'PartialError'
