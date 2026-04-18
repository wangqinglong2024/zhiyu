import { z } from 'zod'

// ===== SRS 复习项行 =====
export interface SrsReviewItemRow {
  id: string
  user_id: string
  source_type: 'wrong_answer' | 'vocabulary' | 'grammar'
  lesson_id: string | null
  source_id: string | null
  card_front: Record<string, unknown>
  card_back: Record<string, unknown>
  interval_stage: number
  next_review_at: string
  last_reviewed_at: string | null
  total_reviews: number
  correct_streak: number
  wrong_streak: number
  total_correct: number
  total_wrong: number
  status: 'active' | 'graduated' | 'suspended'
  graduated_at: string | null
  created_at: string
  updated_at: string
}

// ===== 复习结果提交 =====
export const SubmitReviewSchema = z.object({
  result: z.enum(['remembered', 'forgotten']),
  time_ms: z.number().int().min(0).optional(),
})

export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>

// ===== 手动添加复习项 =====
export const AddReviewItemSchema = z.object({
  source_type: z.enum(['wrong_answer', 'vocabulary', 'grammar']),
  source_id: z.string().min(1).max(100),
  lesson_id: z.string().uuid().optional(),
  card_front: z.record(z.unknown()),
  card_back: z.record(z.unknown()),
})

export type AddReviewItemInput = z.infer<typeof AddReviewItemSchema>

// ===== 查询参数 =====
export const DueItemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  module: z.enum(['vocabulary', 'grammar', 'wrong_answer']).optional(),
})

// ===== 复习统计响应 =====
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

// ===== 复习结果响应 =====
export interface ReviewResultResponse {
  new_interval_stage: number
  next_review_at: string
  next_interval_days: number
  correct_streak: number
  is_graduated: boolean
  daily_reviewed: number
  daily_remaining: number
}
