import { type FC, useCallback } from 'react'
import { Lock } from 'lucide-react'
import { useLoginWall } from '../../auth/hooks/use-login-wall'
import { useLanguage } from '../../i18n/hooks/use-language'
import type { Category } from '../types/discover-china.types'

interface LockedCategoryCardProps {
  category: Category
}

const LOCK_LABELS: Record<string, string> = {
  zh: '登录解锁',
  en: 'Sign in to unlock',
  vi: 'Đăng nhập để mở khóa',
}

export const LockedCategoryCard: FC<LockedCategoryCardProps> = ({ category }) => {
  const { guardCategory } = useLoginWall()
  const { uiLanguage } = useLanguage()

  const handleClick = useCallback(() => {
    guardCategory(String(category.id))
  }, [guardCategory, category.id])

  return (
    <button
      className="glass-card rounded-3xl overflow-hidden text-left w-full relative
        active:scale-[0.97] transition-transform duration-100"
      onClick={handleClick}
      aria-label={LOCK_LABELS[uiLanguage]}
    >
      {/* Cover image — dimmed */}
      <div className="aspect-[4/3] relative bg-[var(--bg-elevated)] opacity-40">
        {category.coverUrl ? (
          <img
            src={category.coverUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-rose)]/20 to-[var(--color-sky)]/20" />
        )}
      </div>

      {/* Text — dimmed */}
      <div className="p-3 opacity-40">
        <h3 className="text-base font-semibold font-[var(--font-heading)] text-[var(--color-text-primary)] truncate">
          {category.name}
        </h3>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 rounded-3xl" />

      {/* Lock label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="glass-elevated rounded-full px-4 py-2 flex items-center gap-2
          text-sm font-medium text-white">
          <Lock size={16} />
          {LOCK_LABELS[uiLanguage]}
        </span>
      </div>
    </button>
  )
}

LockedCategoryCard.displayName = 'LockedCategoryCard'
