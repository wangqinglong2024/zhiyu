import { APP_CONFIG } from '../../../lib/constants'
import type {
  Category,
  ArticleListItem,
  ArticleDetail,
  DailyQuote,
  PaginatedResponse,
  FavoriteItem,
} from '../types/discover-china.types'

const API_BASE = APP_CONFIG.apiBase || ''

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('access_token')
  if (token) return { Authorization: `Bearer ${token}` }
  return {}
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || `API Error ${res.status}`)
  }

  return json.data as T
}

// 类目
export async function fetchCategories(locale: string): Promise<{ items: Category[] }> {
  return apiFetch(`/api/v1/categories?locale=${locale}`)
}

// 文章列表
export async function fetchArticleList(
  categoryId: number,
  page: number,
  pageSize: number,
  sort: 'latest' | 'popular',
  locale: string,
): Promise<PaginatedResponse<ArticleListItem>> {
  return apiFetch(
    `/api/v1/categories/${categoryId}/articles?page=${page}&pageSize=${pageSize}&sort=${sort}&locale=${locale}`,
  )
}

// 文章详情
export async function fetchArticleDetail(articleId: string): Promise<ArticleDetail> {
  return apiFetch(`/api/v1/articles/${articleId}`)
}

// 记录浏览
export async function recordArticleView(articleId: string, fingerprint?: string): Promise<{ counted: boolean }> {
  return apiFetch(`/api/v1/articles/${articleId}/view`, {
    method: 'POST',
    body: JSON.stringify({ fingerprint }),
  })
}

// 当日金句
export async function fetchDailyQuote(): Promise<DailyQuote | null> {
  return apiFetch(`/api/v1/daily-quotes/today`)
}

// 金句列表
export async function fetchDailyQuotes(page: number, pageSize: number): Promise<PaginatedResponse<DailyQuote>> {
  return apiFetch(`/api/v1/daily-quotes?page=${page}&pageSize=${pageSize}`)
}

// 收藏
export async function addFavorite(articleId: string): Promise<{ id: string; articleId: string; createdAt: string }> {
  return apiFetch('/api/v1/favorites', {
    method: 'POST',
    body: JSON.stringify({ articleId }),
  })
}

export async function removeFavorite(articleId: string): Promise<null> {
  return apiFetch(`/api/v1/favorites/${articleId}`, {
    method: 'DELETE',
  })
}

export async function fetchFavorites(
  page: number,
  pageSize: number,
  locale: string,
): Promise<PaginatedResponse<FavoriteItem>> {
  return apiFetch(`/api/v1/favorites?page=${page}&pageSize=${pageSize}&locale=${locale}`)
}

export async function checkFavorites(articleIds: string[]): Promise<Record<string, boolean>> {
  return apiFetch('/api/v1/favorites/check', {
    method: 'POST',
    body: JSON.stringify({ articleIds }),
  })
}
