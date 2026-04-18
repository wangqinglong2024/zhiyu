import { type FC, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'
import { fetchFavorites, removeFavorite } from '../services/api'
import { useFavoriteStore } from '../stores/favorite-store'
import { ArticleCard } from '../components/ArticleCard'
import { FavoriteConfirmDialog } from '../components/FavoriteConfirmDialog'
import { LoadMoreIndicator } from '../components/LoadMoreIndicator'
import { EmptyState } from '../../../core/components/states/EmptyState'
import type { FavoriteItem } from '../types/discover-china.types'

const TITLES: Record<string, string> = {
  zh: '我的收藏',
  en: 'My Favorites',
  vi: 'Bài đã lưu',
}

export const MyFavoritesPage: FC = () => {
  const navigate = useNavigate()
  const { uiLanguage } = useLanguage()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Confirm dialog
  const [confirmArticleId, setConfirmArticleId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const pageSize = 20

  const loadFavorites = useCallback(async (p: number, reset: boolean) => {
    if (reset) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const data = await fetchFavorites(p, pageSize, uiLanguage)
      if (reset) {
        setFavorites(data.items)
      } else {
        setFavorites(prev => [...prev, ...data.items])
      }
      setHasMore(p < data.pagination.totalPages)
      setPage(p)
    } catch {
      // Ignore
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [uiLanguage])

  useEffect(() => { loadFavorites(1, true) }, [loadFavorites])

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting && hasMore && !isLoadingMore) loadFavorites(page + 1, false) },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, isLoadingMore, page, loadFavorites])

  // Remove favorite with confirm
  const handleRemoveConfirm = useCallback(async () => {
    if (!confirmArticleId) return
    setRemovingId(confirmArticleId)
    setConfirmArticleId(null)

    try {
      await removeFavorite(confirmArticleId)
      useFavoriteStore.getState().setFavorited(confirmArticleId, false)
      // Animate out then remove
      setTimeout(() => {
        setFavorites(prev => prev.filter(f => f.articleId !== removingId))
        setRemovingId(null)
      }, 300)
    } catch {
      setRemovingId(null)
    }
  }, [confirmArticleId, removingId])

  return (
    <div className="min-h-screen pb-4">
      {/* Nav bar */}
      <div className="sticky top-0 z-30 h-14 glass-elevated flex items-center px-4">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center -ml-2"
          aria-label="Back"
        >
          <ChevronLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>
        <h2 className="text-lg font-semibold font-[var(--font-heading)] text-[var(--color-text-primary)] absolute left-1/2 -translate-x-1/2">
          {TITLES[uiLanguage]}
        </h2>
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card rounded-3xl p-3 flex gap-3 h-[99px]">
                <div className="w-[100px] h-[75px] rounded-xl bg-[var(--color-text-tertiary)] opacity-10 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-20 w-4/5 mb-2" />
                  <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            title={uiLanguage === 'zh' ? '暂无收藏' : uiLanguage === 'en' ? 'No favorites yet' : 'Chưa có bài lưu'}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {favorites.map(fav => (
              <div
                key={fav.id}
                className={`transition-all duration-300 ${removingId === fav.articleId ? 'translate-x-[-100%] opacity-0' : ''}`}
              >
                <ArticleCard
                  article={{
                    id: fav.articleId,
                    slug: '',
                    title: fav.article.title,
                    summary: fav.article.summary,
                    thumbnailUrl: fav.article.thumbnailUrl,
                    viewCount: fav.article.viewCount,
                    favoriteCount: 0,
                    isFavorited: true,
                    publishedAt: fav.article.publishedAt,
                  }}
                  onClick={() => navigate(`/discover/article/${fav.articleId}`)}
                  favoriteSlot={
                    <button
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmArticleId(fav.articleId)
                      }}
                    >
                      <span className="text-[var(--color-rose)]">❤️</span>
                    </button>
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} />
        <LoadMoreIndicator isLoading={isLoadingMore} hasMore={hasMore} />
      </div>

      <FavoriteConfirmDialog
        open={!!confirmArticleId}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmArticleId(null)}
      />
    </div>
  )
}

MyFavoritesPage.displayName = 'MyFavoritesPage'
