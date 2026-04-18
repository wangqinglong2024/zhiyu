import { create } from 'zustand'
import { addFavorite, removeFavorite, checkFavorites } from '../services/api'

interface FavoriteStore {
  favorites: Map<string, boolean>
  toggle: (articleId: string) => Promise<void>
  check: (articleIds: string[]) => Promise<void>
  isFavorited: (articleId: string) => boolean
  setFavorited: (articleId: string, value: boolean) => void
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: new Map(),

  isFavorited: (articleId: string) => {
    return get().favorites.get(articleId) ?? false
  },

  setFavorited: (articleId: string, value: boolean) => {
    set(state => {
      const next = new Map(state.favorites)
      next.set(articleId, value)
      return { favorites: next }
    })
  },

  toggle: async (articleId: string) => {
    const current = get().isFavorited(articleId)
    // Optimistic update
    get().setFavorited(articleId, !current)

    try {
      if (current) {
        await removeFavorite(articleId)
      } else {
        await addFavorite(articleId)
      }
    } catch {
      // Rollback on failure
      get().setFavorited(articleId, current)
      throw new Error(current ? '操作失败，请重试' : '收藏失败，请重试')
    }
  },

  check: async (articleIds: string[]) => {
    if (articleIds.length === 0) return
    const result = await checkFavorites(articleIds)
    set(state => {
      const next = new Map(state.favorites)
      for (const [id, val] of Object.entries(result)) {
        next.set(id, val)
      }
      return { favorites: next }
    })
  },
}))
