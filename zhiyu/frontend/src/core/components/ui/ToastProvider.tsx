import { createContext, useState, useCallback, type FC, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Toast, type ToastType, type ToastData } from './Toast'

const MAX_TOASTS = 3

const AUTO_DISMISS_MS: Record<ToastType, number | null> = {
  success: 3000,
  info: 3000,
  warning: 5000,
  error: null, // 手动关闭
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

let idCounter = 0

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++idCounter}`
    const newToast: ToastData = { id, type, message }

    setToasts(prev => {
      const updated = [...prev, newToast]
      // 超过 MAX_TOASTS 时移除最早的
      return updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated
    })

    const ms = AUTO_DISMISS_MS[type]
    if (ms) {
      setTimeout(() => dismiss(id), ms)
    }
  }, [dismiss])

  const value: ToastContextValue = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed top-0 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

ToastProvider.displayName = 'ToastProvider'
