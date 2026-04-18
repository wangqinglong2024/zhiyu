import { type FC } from 'react'

type BadgeVariant = 'dot' | 'count'

interface BadgeProps {
  variant?: BadgeVariant
  count?: number
  className?: string
}

export const Badge: FC<BadgeProps> = ({ variant = 'dot', count, className = '' }) => {
  if (variant === 'dot') {
    return (
      <span className={`w-2 h-2 rounded-full bg-[var(--color-rose-primary)] ${className}`} aria-hidden="true" />
    )
  }

  if (!count || count <= 0) return null
  const display = count > 99 ? '99+' : String(count)

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-rose-primary)] text-white text-[10px] font-bold leading-none ${className}`}
      aria-label={`${count}条消息`}
    >
      {display}
    </span>
  )
}

Badge.displayName = 'Badge'
