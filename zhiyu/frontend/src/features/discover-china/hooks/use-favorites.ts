import { useCallback } from 'react'
import { useFavoriteStore } from '../stores/favorite-store'
import { useLoginWall } from '../../auth/hooks/use-login-wall'

export function useFavorites() {
  const { isFavorited, toggle, check, setFavorited } = useFavoriteStore()
  const { guardCollect, isAuthenticated } = useLoginWall()

  const toggleFavorite = useCallback(async (articleId: string) => {
    if (!isAuthenticated) {
      guardCollect(articleId)
      return
    }
    await toggle(articleId)
  }, [isAuthenticated, guardCollect, toggle])

  return {
    isFavorited,
    toggleFavorite,
    checkFavorites: check,
    setFavorited,
    isAuthenticated,
  }
}
