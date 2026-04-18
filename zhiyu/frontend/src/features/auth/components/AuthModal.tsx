import { type FC, useState, useRef, useCallback, useEffect } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordFlow } from './ForgotPasswordFlow'
import type { AuthView } from '../types'
import type { AuthResponse } from '../../../types/api'

interface AuthModalProps {
  isOpen: boolean
  initialView?: AuthView
  onClose: () => void
  onSuccess: (data: AuthResponse) => void
}

export const AuthModal: FC<AuthModalProps> = ({
  isOpen,
  initialView = 'login',
  onClose,
  onSuccess,
}) => {
  const [view, setView] = useState<AuthView>(initialView)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragDelta = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    if (isOpen) setView(initialView)
  }, [isOpen, initialView])

  // 拖拽关闭
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('input, button, a, textarea')) return
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
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (dragDelta.current > 120) {
      onClose()
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
    dragDelta.current = 0
  }, [onClose])

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="认证弹窗">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[4px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-[32px] glass-elevated animate-slide-up"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 拖拽条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-40" />
        </div>

        {/* 内容 */}
        {view === 'login' && (
          <LoginForm
            onSuccess={onSuccess}
            onSwitchToRegister={() => setView('register')}
            onForgotPassword={() => setView('forgot')}
          />
        )}
        {view === 'register' && (
          <RegisterForm
            onSuccess={onSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
        {view === 'forgot' && (
          <ForgotPasswordFlow
            onBack={() => setView('login')}
            onDone={() => setView('login')}
          />
        )}

        {/* 底部安全间距 */}
        <div className="h-4" />
      </div>
    </div>
  )
}

AuthModal.displayName = 'AuthModal'
