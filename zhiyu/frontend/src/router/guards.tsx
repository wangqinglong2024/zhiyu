import { type FC, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGuardProps {
  children: ReactNode
  isAuthenticated: boolean
  onLoginRequired?: () => void
}

/** 需要登录态的路由守卫 */
export const AuthGuard: FC<AuthGuardProps> = ({
  children,
  isAuthenticated,
  onLoginRequired,
}) => {
  const location = useLocation()

  if (!isAuthenticated) {
    onLoginRequired?.()
    return <Navigate to="/discover" state={{ from: location }} replace />
  }

  return <>{children}</>
}

AuthGuard.displayName = 'AuthGuard'

interface PaidGuardProps {
  children: ReactNode
  isPaid: boolean
}

/** 需要付费的路由守卫（占位） */
export const PaidGuard: FC<PaidGuardProps> = ({ children, isPaid }) => {
  if (!isPaid) {
    // 后续实现付费墙 UI
    return <>{children}</>
  }
  return <>{children}</>
}

PaidGuard.displayName = 'PaidGuard'
