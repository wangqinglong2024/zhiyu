import { useState, useEffect, useCallback } from 'react'
import { fetchArticleDetail, recordArticleView } from '../services/api'
import type { ArticleDetail } from '../types/discover-china.types'

const CACHE_KEY_PREFIX = 'article_detail_'
const MAX_CACHED = 50

function getCachedArticle(articleId: string): ArticleDetail | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + articleId)
    if (cached) return JSON.parse(cached)
  } catch { /* ignore */ }
  return null
}

function cacheArticle(articleId: string, data: ArticleDetail): void {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + articleId, JSON.stringify(data))
    // LRU: cleanup old entries if too many
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX))
    if (keys.length > MAX_CACHED) {
      keys.slice(0, keys.length - MAX_CACHED).forEach(k => localStorage.removeItem(k))
    }
  } catch { /* ignore */ }
}

export function useArticleDetail(articleId: string) {
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Check cache
    const cached = getCachedArticle(articleId)
    if (cached) {
      setArticle(cached)
      setIsLoading(false)
      // Still refresh in background
    }

    try {
      const data = await fetchArticleDetail(articleId)
      setArticle(data)
      cacheArticle(articleId, data)
      // Record view
      recordArticleView(articleId).catch(() => {})
    } catch (err) {
      if (!cached) {
        setError(err instanceof Error ? err.message : '加载失败')
      }
    } finally {
      setIsLoading(false)
    }
  }, [articleId])

  useEffect(() => { load() }, [load])

  return { article, isLoading, error, refetch: load }
}
