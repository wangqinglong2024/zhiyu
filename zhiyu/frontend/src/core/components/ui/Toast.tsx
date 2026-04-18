import { type FC } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  message: string
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const iconMap: Record<ToastType, FC<{ size: number; className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-[var(--color-amber-primary)]',
  info: 'text-[var(--color-sky-primary)]',
}

export const Toast: FC<ToastProps> = ({ toast, onDismiss }) => {
  const Icon = iconMap[toast.type]

  return (
    <div
      className="glass-elevated flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[360px] animate-slide-down"
      role="alert"
    >
      <Icon size={18} className={colorMap[toast.type]} />
      <span className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</span>
      {toast.type === 'error' && (
        <button
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          onClick={() => onDismiss(toast.id)}
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

Toast.displayName = 'Toast'
