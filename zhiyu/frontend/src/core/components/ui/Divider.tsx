import { type FC } from 'react'

interface DividerProps {
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export const Divider: FC<DividerProps> = ({ direction = 'horizontal', className = '' }) => {
  if (direction === 'vertical') {
    return <div className={`w-px h-full bg-[var(--glass-border)] ${className}`} role="separator" aria-orientation="vertical" />
  }

  return <div className={`w-full h-px bg-[var(--glass-border)] ${className}`} role="separator" aria-orientation="horizontal" />
}

Divider.displayName = 'Divider'
