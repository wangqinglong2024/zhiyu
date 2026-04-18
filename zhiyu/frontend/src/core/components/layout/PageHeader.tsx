import { type FC, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightActions?: ReactNode
  transparent?: boolean
  className?: string
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  showBack = true,
  onBack,
  rightActions,
  transparent = false,
  className = '',
}) => {
  const navigate = useNavigate()
  const handleBack = onBack || (() => navigate(-1))

  return (
    <header
      className={`sticky top-0 z-50 h-11 flex items-center px-4 ${
        transparent ? 'bg-transparent' : 'glass'
      } ${className}`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* 返回按钮 */}
      {showBack && (
        <button
          className="w-8 h-8 flex items-center justify-center -ml-1"
          onClick={handleBack}
          aria-label="返回"
        >
          <ChevronLeft size={22} className="text-[var(--text-primary)]" />
        </button>
      )}

      {/* 标题 */}
      <h1 className="flex-1 text-center text-base font-semibold text-[var(--text-primary)] truncate px-2">
        {title}
      </h1>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-1 min-w-[32px] justify-end">
        {rightActions}
      </div>

      {/* 占位平衡（无返回按钮时不需要） */}
      {!showBack && <div className="w-8" />}
    </header>
  )
}

PageHeader.displayName = 'PageHeader'
