import { supabaseAdmin } from '../core/supabase'
import type { LevelRow, UnitRow, LessonRow } from '../models/course'

// ===== Level =====
export async function findAllLevels(): Promise<LevelRow[]> {
  const { data, error } = await supabaseAdmin
    .from('levels')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as LevelRow[]
}

export async function findLevelById(levelId: string): Promise<LevelRow | null> {
  const { data, error } = await supabaseAdmin
    .from('levels')
    .select('*')
    .eq('id', levelId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as LevelRow | null
}

export async function findLevelByNumber(levelNumber: number): Promise<LevelRow | null> {
  const { data, error } = await supabaseAdmin
    .from('levels')
    .select('*')
    .eq('level_number', levelNumber)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as LevelRow | null
}

// ===== Unit =====
export async function findUnitsByLevelId(levelId: string): Promise<UnitRow[]> {
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('level_id', levelId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as UnitRow[]
}

export async function findUnitById(unitId: string): Promise<UnitRow | null> {
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as UnitRow | null
}

// ===== Lesson =====
export async function findLessonsByUnitId(unitId: string): Promise<LessonRow[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('unit_id', unitId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as LessonRow[]
}

export async function findLessonById(lessonId: string): Promise<LessonRow | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as LessonRow | null
}

// ===== 购买状态查询 =====
export async function findUserActivePurchases(userId: string): Promise<Array<{ level_id: string; expires_at: string }>> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .select('level_id, expires_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('expires_at', new Date().toISOString())

  if (error) throw error
  return data ?? []
}

// ===== 用户进度查询 (Level) =====
export async function findUserCourseProgress(userId: string): Promise<Array<{ level_id: string; status: string; completed_lessons: number; total_lessons: number; progress_percentage: number }>> {
  const { data, error } = await supabaseAdmin
    .from('user_course_progress')
    .select('level_id, status, completed_lessons, total_lessons, progress_percentage')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

// ===== 用户单元进度 =====
export async function findUserUnitProgress(userId: string, levelId: string): Promise<Array<{ unit_id: string; status: string; completed_lessons: number; total_lessons: number; assessment_score: number | null; assessment_passed: boolean }>> {
  const { data, error } = await supabaseAdmin
    .from('user_unit_progress')
    .select('unit_id, status, completed_lessons, total_lessons, assessment_score, assessment_passed')
    .eq('user_id', userId)
    .eq('level_id', levelId)

  if (error) throw error
  return data ?? []
}

// ===== 用户课时进度 =====
export async function findUserLessonProgress(userId: string, unitId: string): Promise<Array<{ lesson_id: string; status: string; resume_data: Record<string, unknown>; total_study_seconds: number }>> {
  const { data, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .select('lesson_id, status, resume_data, total_study_seconds')
    .eq('user_id', userId)
    .eq('unit_id', unitId)

  if (error) throw error
  return data ?? []
}
