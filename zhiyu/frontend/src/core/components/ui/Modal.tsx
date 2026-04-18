import { type FC, type ReactNode, useEffect, useRef, useCallback } from 'react'

type ModalVariant = 'info' | 'confirm' | 'danger'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  variant?: ModalVariant
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  children?: ReactNode
  className?: string
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  confirmLabel,
  cancelLabel = '取消',
  onConfirm,
  children,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const isDanger = variant === 'danger'

  // 焦点陷阱
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (!isDanger) onClose()
      return
    }
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }, [isDanger, onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // 自动聚焦
    const timer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button, [tabindex]')
      firstFocusable?.focus()
    }, 50)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      clearTimeout(timer)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-fade-in"
        onClick={isDanger ? undefined : onClose}
        aria-hidden="true"
      />

      {/* 对话框 */}
      <div
        ref={modalRef}
        className={`relative glass-elevated max-w-sm w-full p-6 animate-scale-in ${className}`}
      >
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">{description}</p>
        )}

        {children}

        {(variant === 'confirm' || variant === 'danger') && (
          <div className="flex gap-3 mt-5">
            <button
              className="flex-1 py-2.5 rounded-full text-sm font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold text-white ${
                isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--color-rose-primary)]'
              }`}
              onClick={onConfirm}
            >
              {confirmLabel || (isDanger ? '确认删除' : '确认')}
            </button>
          </div>
        )}

        {variant === 'info' && (
          <div className="mt-5">
            <button className="btn-primary w-full" onClick={onClose}>
              {confirmLabel || '知道了'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

Modal.displayName = 'Modal'
