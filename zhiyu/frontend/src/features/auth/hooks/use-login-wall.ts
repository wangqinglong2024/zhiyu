import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginWallContext, type LoginWallAction } from '../contexts/LoginWallContext'

export function useLoginWall() {
  const { requireAuth, isAuthenticated, pendingAction, openAuthModal } = useLoginWallContext()
  const navigate = useNavigate()

  const guard = useCallback((action: LoginWallAction): boolean => {
    return requireAuth(action)
  }, [requireAuth])

  const guardTab = useCallback((targetTab: string) => {
    if (isAuthenticated) {
      navigate(targetTab)
      return true
    }
    openAuthModal({ type: 'navigate_tab', payload: { targetTab } })
    return false
  }, [isAuthenticated, navigate, openAuthModal])

  const guardCategory = useCallback((categoryId: string) => {
    return requireAuth({ type: 'unlock_category', payload: { categoryId } })
  }, [requireAuth])

  const guardCollect = useCallback((articleId: string) => {
    return requireAuth({ type: 'collect_article', payload: { articleId } })
  }, [requireAuth])

  return { guard, guardTab, guardCategory, guardCollect, isAuthenticated, pendingAction }
}
