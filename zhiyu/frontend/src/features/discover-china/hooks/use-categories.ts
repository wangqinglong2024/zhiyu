import { useState, useEffect, useCallback } from 'react'
import { fetchCategories } from '../services/api'
import type { Category } from '../types/discover-china.types'

const CACHE_KEY = 'discover_categories'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface CacheData {
  items: Category[]
  timestamp: number
  locale: string
}

export function useCategories(locale: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data: CacheData = JSON.parse(cached)
        if (data.locale === locale && Date.now() - data.timestamp < CACHE_TTL) {
          setCategories(data.items)
          setIsLoading(false)
          return
        }
      }
    } catch { /* ignore cache errors */ }

    setIsLoading(true)
    setError(null)
    try {
      const { items } = await fetchCategories(locale)
      setCategories(items)
      localStorage.setItem(CACHE_KEY, JSON.stringify({ items, timestamp: Date.now(), locale }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  useEffect(() => { load() }, [load])

  return { categories, isLoading, error, refetch: load }
}
