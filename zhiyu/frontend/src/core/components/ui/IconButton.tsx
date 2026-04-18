import { type ButtonHTMLAttributes, type FC, type ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  variant?: 'default' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  label: string
}

const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }

export const IconButton: FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  label,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none'
  const variantClass = variant === 'ghost'
    ? 'bg-transparent hover:bg-[var(--glass-bg)]'
    : 'glass hover:scale-105 active:scale-95'

  return (
    <button
      className={`${base} ${variantClass} ${sizeMap[size]} ${className}`}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  )
}

IconButton.displayName = 'IconButton'
