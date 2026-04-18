import { useState, useEffect, useCallback } from 'react'
import { fetchDailyQuote } from '../services/api'
import type { DailyQuote } from '../types/discover-china.types'

const CACHE_KEY = 'discover_daily_quote'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function useDailyQuote() {
  const [quote, setQuote] = useState<DailyQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        if (Date.now() - data.timestamp < CACHE_TTL) {
          setQuote(data.quote)
          setIsLoading(false)
          return
        }
      }
    } catch { /* ignore */ }

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchDailyQuote()
      setQuote(data)
      localStorage.setItem(CACHE_KEY, JSON.stringify({ quote: data, timestamp: Date.now() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { quote, isLoading, error, refetch: load }
}
