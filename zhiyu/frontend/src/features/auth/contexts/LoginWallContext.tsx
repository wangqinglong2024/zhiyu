import { createContext, useState, useCallback, useContext, type ReactNode } from 'react'
import type { AuthResponse, UserProfile } from '../../../types/api'
import { authService } from '../services/auth-service'

export type LoginWallActionType = 'navigate_tab' | 'unlock_category' | 'collect_article'

export interface LoginWallAction {
  type: LoginWallActionType
  payload: {
    targetTab?: string
    categoryId?: string
    articleId?: string
  }
}

interface LoginWallContextValue {
  isAuthModalOpen: boolean
  pendingAction: LoginWallAction | null
  user: UserProfile | null
  isAuthenticated: boolean
  openAuthModal: (action?: LoginWallAction) => void
  closeAuthModal: () => void
  handleAuthSuccess: (data: AuthResponse) => void
  logout: () => void
  requireAuth: (action: LoginWallAction) => boolean
}

const LoginWallContext = createContext<LoginWallContextValue | null>(null)

export function LoginWallProvider({ children }: { children: ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<LoginWallAction | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)

  const isAuthenticated = !!user

  const openAuthModal = useCallback((action?: LoginWallAction) => {
    if (action) setPendingAction(action)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
    setPendingAction(null)
  }, [])

  const handleAuthSuccess = useCallback((data: AuthResponse) => {
    setUser(data.user)
    setIsAuthModalOpen(false)
    // pendingAction 在 UI 层处理（如 TabBar 监听 user 变化自动导航）
    setPendingAction(null)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const requireAuth = useCallback((action: LoginWallAction): boolean => {
    if (isAuthenticated) return true
    openAuthModal(action)
    return false
  }, [isAuthenticated, openAuthModal])

  return (
    <LoginWallContext.Provider value={{
      isAuthModalOpen,
      pendingAction,
      user,
      isAuthenticated,
      openAuthModal,
      closeAuthModal,
      handleAuthSuccess,
      logout,
      requireAuth,
    }}>
      {children}
    </LoginWallContext.Provider>
  )
}

export function useLoginWallContext() {
  const ctx = useContext(LoginWallContext)
  if (!ctx) throw new Error('useLoginWallContext must be used within LoginWallProvider')
  return ctx
}
