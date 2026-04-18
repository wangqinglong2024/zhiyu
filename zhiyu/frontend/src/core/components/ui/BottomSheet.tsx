import { type FC, type ReactNode, useRef, useCallback, useEffect } from 'react'

type SheetSize = 'sm' | 'md' | 'lg'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  size?: SheetSize
  title?: string
  children: ReactNode
  className?: string
}

const sizeMap: Record<SheetSize, string> = {
  sm: 'max-h-[30vh]',
  md: 'max-h-[50vh]',
  lg: 'max-h-[70vh]',
}

export const BottomSheet: FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  children,
  className = '',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragDelta = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('input, button, a, textarea, select')) return
    dragStartY.current = e.touches[0]!.clientY
    isDragging.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0]!.clientY - dragStartY.current
    if (delta > 0) {
      dragDelta.current = delta
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`
        sheetRef.current.style.transition = 'none'
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (sheetRef.current) {
      sheetRef.current.style.transition = ''
    }
    if (dragDelta.current > 120) {
      onClose()
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
    dragDelta.current = 0
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={title || '底部弹窗'}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 ${sizeMap[size]} overflow-y-auto rounded-t-[32px] glass-elevated animate-slide-up transition-transform duration-250 ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 拖拽条 */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0">
          <div className="w-8 h-1 rounded-full bg-[var(--text-tertiary)] opacity-40" />
        </div>

        {title && (
          <h3 className="px-6 pb-3 text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        )}

        <div className="px-6 pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}

BottomSheet.displayName = 'BottomSheet'
