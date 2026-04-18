import { supabaseAdmin } from '../core/supabase'

// ===== 课时进度 =====
export async function findLessonProgress(userId: string, lessonId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  unitId: string,
  levelId: string,
  updates: Record<string, unknown>,
) {
  const existing = await findLessonProgress(userId, lessonId)

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('user_lesson_progress')
      .update({ ...updates, last_studied_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('updated_at', existing.updated_at) // 乐观锁
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      unit_id: unitId,
      level_id: levelId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_studied_at: new Date().toISOString(),
      ...updates,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLessonStatus(
  userId: string,
  lessonId: string,
  status: string,
  extraFields: Record<string, unknown> = {},
) {
  const now = new Date().toISOString()
  const updates: Record<string, unknown> = { status, last_studied_at: now, ...extraFields }

  if (status === 'content_done') updates.content_done_at = now
  if (status === 'completed') updates.completed_at = now

  const { data, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .update(updates)
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ===== 单元进度 =====
export async function findUnitProgress(userId: string, unitId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_unit_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('unit_id', unitId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertUnitProgress(userId: string, unitId: string, levelId: string, updates: Record<string, unknown>) {
  const existing = await findUnitProgress(userId, unitId)

  if (existing) {
    const { error } = await supabaseAdmin
      .from('user_unit_progress')
      .update(updates)
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabaseAdmin
    .from('user_unit_progress')
    .insert({ user_id: userId, unit_id: unitId, level_id: levelId, ...updates })
  if (error) throw error
}

// ===== Level 进度 =====
export async function findCourseProgress(userId: string, levelId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertCourseProgress(userId: string, levelId: string, updates: Record<string, unknown>) {
  const existing = await findCourseProgress(userId, levelId)

  if (existing) {
    const { error } = await supabaseAdmin
      .from('user_course_progress')
      .update({ ...updates, last_studied_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabaseAdmin
    .from('user_course_progress')
    .insert({
      user_id: userId,
      level_id: levelId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_studied_at: new Date().toISOString(),
      ...updates,
    })
  if (error) throw error
}

// ===== 全局进度 =====
export async function findAllCourseProgress(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_course_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

export async function countCompletedLessons(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (error) throw error
  return count ?? 0
}

export async function sumStudySeconds(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .select('total_study_seconds')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).reduce((sum, r) => sum + (r.total_study_seconds || 0), 0)
}

// ===== 单元内课时进度统计 =====
export async function countCompletedLessonsInUnit(userId: string, unitId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('user_lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('unit_id', unitId)
    .eq('status', 'completed')

  if (error) throw error
  return count ?? 0
}

// ===== 单元解锁状态批量查询 =====
export async function findUnitProgressByLevel(userId: string, levelId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_unit_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level_id', levelId)

  if (error) throw error
  return data ?? []
}
