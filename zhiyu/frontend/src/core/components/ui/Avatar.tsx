import { type FC } from 'react'
import { User } from 'lucide-react'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: AvatarSize
  className?: string
}

const sizeMap: Record<AvatarSize, { container: string; icon: number }> = {
  sm: { container: 'w-8 h-8', icon: 14 },
  md: { container: 'w-10 h-10', icon: 18 },
  lg: { container: 'w-14 h-14', icon: 24 },
}

export const Avatar: FC<AvatarProps> = ({ src, alt = '', size = 'md', className = '' }) => {
  const { container, icon } = sizeMap[size]

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${container} rounded-full object-cover ${className}`}
        loading="lazy"
      />
    )
  }

  return (
    <div className={`${container} rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center ${className}`}>
      <User size={icon} className="text-[var(--text-tertiary)]" />
    </div>
  )
}

Avatar.displayName = 'Avatar'
