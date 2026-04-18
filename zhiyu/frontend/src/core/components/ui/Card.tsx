import { type FC, type ReactNode } from 'react'

interface CardProps {
  variant?: 'default' | 'glass'
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const Card: FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  onClick,
}) => {
  const base = variant === 'glass'
    ? 'glass-card'
    : 'bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-2xl shadow-sm'

  return (
    <div
      className={`${base} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

Card.displayName = 'Card'
