import { type FC, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'
import { useArticleList } from '../hooks/use-article-list'
import { useCategories } from '../hooks/use-categories'
import { ArticleCard } from '../components/ArticleCard'
import { SortToggle } from '../components/SortToggle'
import { CategoryCover } from '../components/CategoryCover'
import { LoadMoreIndicator } from '../components/LoadMoreIndicator'
import { ArticleListSkeleton } from '../components/ArticleListSkeleton'
import { FavoriteButton } from '../components/FavoriteButton'
import { EmptyState } from '../../../core/components/states/EmptyState'

export const ArticleListPage: FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { uiLanguage } = useLanguage()
  const catId = Number(categoryId)

  const { categories } = useCategories(uiLanguage)
  const category = categories.find(c => c.id === catId)

  const {
    articles, isLoading, isLoadingMore, error, hasMore,
    sort, loadMore, changeSort,
  } = useArticleList(catId, uiLanguage)

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) loadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const handleArticleClick = useCallback((articleId: string) => {
    navigate(`/discover/article/${articleId}`)
  }, [navigate])

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Sticky nav placeholder */}
        <div className="sticky top-0 z-30 h-14 glass-elevated flex items-center px-4 gap-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="px-4 pt-2 pb-4">
          <ArticleListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Sticky nav bar */}
      <div className="sticky top-0 z-30 h-14 glass-elevated flex items-center justify-between px-4">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center -ml-2"
          aria-label="Back"
        >
          <ChevronLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>
        <h2 className="text-lg font-semibold font-[var(--font-heading)] text-[var(--color-text-primary)] absolute left-1/2 -translate-x-1/2">
          {category?.name || ''}
        </h2>
        <SortToggle value={sort} onChange={changeSort} />
      </div>

      <div className="px-4 pt-2">
        {/* Category cover */}
        {category && <CategoryCover category={category} />}

        {/* Error */}
        {error && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!error && articles.length === 0 && (
          <EmptyState />
        )}

        {/* Article list */}
        <div className="flex flex-col gap-3">
          {articles.map((article, i) => (
            <div
              key={article.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <ArticleCard
                article={article}
                onClick={() => handleArticleClick(article.id)}
                favoriteSlot={
                  <FavoriteButton
                    articleId={article.id}
                    isFavorited={article.isFavorited}
                    size={20}
                  />
                }
              />
            </div>
          ))}
        </div>

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} />

        <LoadMoreIndicator isLoading={isLoadingMore} hasMore={hasMore} />
      </div>
    </div>
  )
}

ArticleListPage.displayName = 'ArticleListPage'
