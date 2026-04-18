import { z } from 'zod'

// ===== 断点续学保存 =====
export const SaveProgressSchema = z.object({
  scroll_position: z.number().min(0).max(1).optional(),
  viewed_vocab_ids: z.array(z.string()).optional(),
  played_audio_ids: z.array(z.string()).optional(),
  last_section_index: z.number().int().min(0).optional(),
  study_seconds_delta: z.number().int().min(0).max(3600).optional(),
})

export type SaveProgressInput = z.infer<typeof SaveProgressSchema>

// ===== 课时状态更新 =====
export const UpdateLessonStatusSchema = z.object({
  status: z.enum(['in_progress', 'content_done', 'completed']),
})

export type UpdateLessonStatusInput = z.infer<typeof UpdateLessonStatusSchema>

// ===== 初始化进度 =====
export const InitializeProgressSchema = z.object({
  start_level: z.number().int().min(1).max(12),
})

export type InitializeProgressInput = z.infer<typeof InitializeProgressSchema>

// ===== 状态机流转 =====
export const LESSON_STATUS_TRANSITIONS: Record<string, string[]> = {
  not_started: ['in_progress'],
  in_progress: ['content_done'],
  content_done: ['completed'],
  completed: [],
}

export function validateStatusTransition(current: string, next: string): boolean {
  return LESSON_STATUS_TRANSITIONS[current]?.includes(next) ?? false
}

// ===== 学习概览响应 =====
export interface ProgressOverview {
  current_level: number | null
  current_level_progress: number
  total_completed_lessons: number
  total_study_hours: number
  streak_days: number
  srs_due_today: number
  levels_progress: Array<{
    level_number: number
    status: string
    progress: number
  }>
}

// ===== 解锁状态响应 =====
export interface UnlockStatusItem {
  unit_id: string
  unit_number: number
  status: string
  is_unlocked: boolean
  assessment_passed: boolean
}
