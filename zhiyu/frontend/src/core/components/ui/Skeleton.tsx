import { type FC } from 'react'

type SkeletonVariant = 'text' | 'circle' | 'rect'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
}

export const Skeleton: FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
}) => {
  const baseClass = 'animate-pulse bg-[var(--glass-border)]'

  if (variant === 'circle') {
    const size = width || height || 40
    return (
      <div
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  if (variant === 'text') {
    return (
      <div
        className={`${baseClass} rounded h-4 ${className}`}
        style={{ width: width || '100%', height }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={`${baseClass} rounded-xl ${className}`}
      style={{ width: width || '100%', height: height || 48 }}
      aria-hidden="true"
    />
  )
}

Skeleton.displayName = 'Skeleton'
