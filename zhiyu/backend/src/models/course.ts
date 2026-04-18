import { z } from 'zod'

// ===== Level =====
export interface LevelRow {
  id: string
  level_number: number
  name_zh: string
  name_en: string
  name_vi: string
  description_zh: string | null
  description_en: string | null
  description_vi: string | null
  hsk_level: string
  cefr_level: string
  school_stage: string | null
  total_units: number
  lessons_per_unit: number
  total_lessons: number
  cumulative_vocab: number
  cumulative_chars: number
  cumulative_idioms: number
  cumulative_poems: number
  estimated_hours: number
  is_free: boolean
  price_usd: number
  coin_price: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LevelWithUserStatus extends LevelRow {
  user_status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  completed_lessons: number
  is_accessible: boolean
  purchase_expires_at: string | null
}

// ===== Unit =====
export interface UnitRow {
  id: string
  level_id: string
  unit_number: number
  name_zh: string
  name_en: string
  name_vi: string
  description_zh: string | null
  description_en: string | null
  description_vi: string | null
  total_lessons: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UnitWithProgress extends UnitRow {
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed'
  completed_lessons: number
  assessment_score: number | null
  assessment_passed: boolean
}

// ===== Lesson =====
export interface LessonRow {
  id: string
  unit_id: string
  level_id: string
  lesson_number: number
  title_zh: string
  title_en: string
  title_vi: string
  content: Record<string, unknown>
  key_vocabulary: unknown[]
  grammar_points: unknown[]
  audio_url: string | null
  estimated_minutes: number
  vocab_count: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LessonWithProgress extends LessonRow {
  status: 'not_started' | 'in_progress' | 'content_done' | 'completed'
  resume_data: Record<string, unknown> | null
  total_study_seconds: number
}

// ===== Zod 校验 =====
export const LevelIdParamSchema = z.object({
  levelId: z.string().uuid('无效的 Level ID'),
})

export const UnitIdParamSchema = z.object({
  unitId: z.string().uuid('无效的 Unit ID'),
})

export const LessonIdParamSchema = z.object({
  lessonId: z.string().uuid('无效的 Lesson ID'),
})

// ===== 状态枚举 =====
export const LEVEL_STATUS = ['not_started', 'in_progress', 'completed'] as const
export const UNIT_STATUS = ['locked', 'unlocked', 'in_progress', 'completed'] as const
export const LESSON_STATUS = ['not_started', 'in_progress', 'content_done', 'completed'] as const

export type LevelStatus = typeof LEVEL_STATUS[number]
export type UnitStatus = typeof UNIT_STATUS[number]
export type LessonStatus = typeof LESSON_STATUS[number]
