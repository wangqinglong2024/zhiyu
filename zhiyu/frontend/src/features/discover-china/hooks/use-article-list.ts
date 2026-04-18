import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchArticleList } from '../services/api'
import type { ArticleListItem } from '../types/discover-china.types'

export function useArticleList(categoryId: number, locale: string) {
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 10
  const abortRef = useRef<AbortController | null>(null)

  const loadPage = useCallback(async (p: number, s: 'latest' | 'popular', reset: boolean) => {
    if (reset) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const data = await fetchArticleList(categoryId, p, pageSize, s, locale)
      if (reset) {
        setArticles(data.items)
      } else {
        setArticles(prev => [...prev, ...data.items])
      }
      setTotal(data.pagination.total)
      setHasMore(p < data.pagination.totalPages)
      setPage(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [categoryId, locale])

  // Initial load
  useEffect(() => {
    loadPage(1, sort, true)
    return () => { abortRef.current?.abort() }
  }, [categoryId, sort, locale, loadPage])

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    loadPage(page + 1, sort, false)
  }, [isLoadingMore, hasMore, page, sort, loadPage])

  const changeSort = useCallback((newSort: 'latest' | 'popular') => {
    setSort(newSort)
    setArticles([])
    setPage(1)
  }, [])

  return {
    articles,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    sort,
    loadMore,
    changeSort,
  }
}
