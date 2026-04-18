import { APP_CONFIG } from '../../../lib/constants'

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

// ===== 课程结构 =====

export interface LevelWithStatus {
  id: string
  level_number: number
  title_zh: string
  title_en: string
  subtitle_zh: string
  subtitle_en: string
  description_zh: string
  description_en: string
  hsk_level: string
  is_free: boolean
  price_usd: number
  coin_price: number
  total_lessons: number
  total_units: number
  user_status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  completed_lessons: number
  is_accessible: boolean
  purchase_expires_at: string | null
}

export interface UnitWithProgress {
  id: string
  level_id: string
  unit_number: number
  title_zh: string
  title_en: string
  total_lessons: number
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed'
  completed_lessons: number
  assessment_score: number | null
  assessment_passed: boolean
}

export interface LessonWithProgress {
  id: string
  unit_id: string
  level_id: string
  lesson_number: number
  title_zh: string
  title_en: string
  lesson_type: string
  content: Record<string, unknown>
  status: 'not_started' | 'in_progress' | 'completed'
  resume_data: Record<string, unknown> | null
  total_study_seconds: number
}

export interface ProgressOverview {
  current_level: number | null
  current_level_progress: number
  total_completed_lessons: number
  total_study_hours: number
  streak_days: number
  srs_due_today: number
  levels_progress: Array<{ level_number: number; status: string; progress: number }>
}

export interface PurchaseStatus {
  is_purchased: boolean
  purchase_type: string | null
  expires_at: string | null
  expiring_soon: boolean
  days_remaining: number | null
}

export interface SrsStats {
  today: {
    total_due: number
    reviewed: number
    remaining: number
    accuracy: number
    daily_limit: number
  }
  overall: {
    total_items: number
    active: number
    graduated: number
    suspended: number
    average_accuracy: number
  }
  streak: {
    current_days: number
    longest_days: number
  }
}

export interface SrsDueResponse {
  items: SrsReviewItem[]
  total_due: number
  daily_remaining: number
  daily_max: number
}

export interface SrsReviewItem {
  id: string
  source_type: string
  source_id: string
  card_front: Record<string, unknown>
  card_back: Record<string, unknown>
  interval_stage: number
  next_interval_days: number
  correct_streak: number
  is_overdue: boolean
  overdue_days: number
}

export interface ReviewResult {
  new_interval_stage: number
  next_review_at: string
  next_interval_days: number
  correct_streak: number
  is_graduated: boolean
  daily_reviewed: number
  daily_remaining: number
}

export interface PlacementTestResult {
  recommended_level: number
  overall_accuracy: number
  coin_reward_claimed: boolean
}

// ===== API 函数 =====

export const fetchLevels = () =>
  apiFetch<LevelWithStatus[]>('/api/v1/courses/levels')

export const fetchUnits = (levelId: string) =>
  apiFetch<UnitWithProgress[]>(`/api/v1/courses/levels/${levelId}`)

export const fetchLessons = (unitId: string) =>
  apiFetch<LessonWithProgress[]>(`/api/v1/courses/units/${unitId}/lessons`)

export const fetchLesson = (lessonId: string) =>
  apiFetch<LessonWithProgress>(`/api/v1/courses/lessons/${lessonId}`)

export const fetchLevelPreview = (levelId: string) =>
  apiFetch<LevelWithStatus>(`/api/v1/courses/levels/${levelId}/preview`)

// 进度
export const fetchProgressOverview = () =>
  apiFetch<ProgressOverview>('/api/v1/course-progress/overview')

export const saveLessonProgress = (lessonId: string, data: Record<string, unknown>) =>
  apiFetch<unknown>(`/api/v1/course-progress/lessons/${lessonId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const updateLessonStatus = (lessonId: string, status: string) =>
  apiFetch<{ status: string }>(`/api/v1/course-progress/lessons/${lessonId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const fetchUnlockStatus = (levelId: string) =>
  apiFetch<Array<{ unit_id: string; unit_number: number; status: string; is_unlocked: boolean; assessment_passed: boolean }>>(
    `/api/v1/course-progress/levels/${levelId}/unlock-status`,
  )

export const initializeProgress = (startLevel: number) =>
  apiFetch<{ message: string; level_number: number }>('/api/v1/course-progress/initialize', {
    method: 'POST',
    body: JSON.stringify({ start_level: startLevel }),
  })

// 购买
export const initiatePaddlePurchase = (levelId: string, idempotencyKey: string) =>
  apiFetch<{ purchase_id: string; checkout_url: string; expires_in: number }>(
    '/api/v1/course-purchases/paddle',
    { method: 'POST', body: JSON.stringify({ level_id: levelId, idempotency_key: idempotencyKey }) },
  )

export const coinExchange = (levelId: string, idempotencyKey: string) =>
  apiFetch<unknown>(
    '/api/v1/course-purchases/coin-exchange',
    { method: 'POST', body: JSON.stringify({ level_id: levelId, idempotency_key: idempotencyKey }) },
  )

export const fetchPurchaseStatus = (levelId: string) =>
  apiFetch<PurchaseStatus>(`/api/v1/course-purchases/levels/${levelId}/status`)

export const fetchPurchases = () =>
  apiFetch<unknown[]>('/api/v1/course-purchases')

// SRS
export const fetchDueItems = (limit = 20, module?: string) =>
  apiFetch<SrsDueResponse>(`/api/v1/srs/due?limit=${limit}${module ? `&module=${module}` : ''}`)

export const submitReview = (itemId: string, result: 'remembered' | 'forgotten', timeMs: number) =>
  apiFetch<ReviewResult>(`/api/v1/srs/reviews/${itemId}`, {
    method: 'POST',
    body: JSON.stringify({ result, time_ms: timeMs }),
  })

export const fetchSrsStats = () =>
  apiFetch<SrsStats>('/api/v1/srs/stats')

export const addSrsItem = (data: Record<string, unknown>) =>
  apiFetch<unknown>('/api/v1/srs/items', {
    method: 'POST',
    body: JSON.stringify(data),
  })

// 入学测试
export const startPlacementTest = () =>
  apiFetch<{ test_id: string; question: unknown }>('/api/v1/placement-tests/start', {
    method: 'POST',
  })

export const submitPlacementAnswer = (testId: string, questionId: string, answer: string) =>
  apiFetch<{ finished: boolean; test_id: string; question?: unknown }>(
    `/api/v1/placement-tests/${testId}/submit`,
    { method: 'POST', body: JSON.stringify({ question_id: questionId, answer }) },
  )

export const completePlacementTest = (testId: string) =>
  apiFetch<PlacementTestResult>(
    `/api/v1/placement-tests/${testId}/complete`,
    { method: 'POST' },
  )

export const fetchPlacementHistory = () =>
  apiFetch<PlacementTestResult | null>('/api/v1/placement-tests/history')
