import { type FC } from 'react'

interface ProgressBarProps {
  value: number // 0-100
  color?: 'rose' | 'sky' | 'amber'
  height?: number
  showLabel?: boolean
  className?: string
}

const colorMap: Record<string, string> = {
  rose: 'bg-[var(--color-rose-primary)]',
  sky: 'bg-[var(--color-sky-primary)]',
  amber: 'bg-[var(--color-amber-primary)]',
}

export const ProgressBar: FC<ProgressBarProps> = ({
  value,
  color = 'rose',
  height = 6,
  showLabel = false,
  className = '',
}) => {
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[var(--text-secondary)]">进度</span>
          <span className="text-xs font-medium text-[var(--text-primary)]">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full bg-[var(--glass-border)] overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

ProgressBar.displayName = 'ProgressBar'
