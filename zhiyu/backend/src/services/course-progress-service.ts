import * as progressRepo from '../repositories/course-progress-repository'
import * as courseRepo from '../repositories/course-repository'
import { BadRequest, NotFound } from '../core/exceptions'
import { validateStatusTransition } from '../models/learning-progress'
import type { SaveProgressInput, ProgressOverview, UnlockStatusItem } from '../models/learning-progress'

/**
 * 保存课时学习进度（断点续学）
 */
export async function saveLessonProgress(userId: string, lessonId: string, input: SaveProgressInput) {
  const lesson = await courseRepo.findLessonById(lessonId)
  if (!lesson) throw NotFound('课时不存在')

  const resumeData: Record<string, unknown> = {}
  if (input.scroll_position !== undefined) resumeData.scroll_position = input.scroll_position
  if (input.viewed_vocab_ids) resumeData.viewed_vocab_ids = input.viewed_vocab_ids
  if (input.played_audio_ids) resumeData.played_audio_ids = input.played_audio_ids
  if (input.last_section_index !== undefined) resumeData.last_section_index = input.last_section_index

  const updates: Record<string, unknown> = {
    resume_data: resumeData,
  }

  // 累加学习时长
  const existing = await progressRepo.findLessonProgress(userId, lessonId)
  if (existing && input.study_seconds_delta) {
    updates.total_study_seconds = (existing.total_study_seconds || 0) + input.study_seconds_delta
  }

  const result = await progressRepo.upsertLessonProgress(
    userId, lessonId, lesson.unit_id, lesson.level_id, updates,
  )

  // 确保 Level 进度已初始化
  await progressRepo.upsertCourseProgress(userId, lesson.level_id, {
    status: 'in_progress',
  })

  return result
}

/**
 * 更新课时学习状态
 */
export async function updateLessonStatus(userId: string, lessonId: string, newStatus: string) {
  const lesson = await courseRepo.findLessonById(lessonId)
  if (!lesson) throw NotFound('课时不存在')

  const existing = await progressRepo.findLessonProgress(userId, lessonId)
  const currentStatus = existing?.status ?? 'not_started'

  if (!validateStatusTransition(currentStatus, newStatus)) {
    throw BadRequest(`非法状态跳跃: ${currentStatus} → ${newStatus}`)
  }

  // 如果还没有进度记录，先创建
  if (!existing) {
    await progressRepo.upsertLessonProgress(userId, lessonId, lesson.unit_id, lesson.level_id, {
      status: newStatus,
    })
  } else {
    await progressRepo.updateLessonStatus(userId, lessonId, newStatus)
  }

  // 课时完成后更新单元进度
  if (newStatus === 'completed') {
    await onLessonCompleted(userId, lesson.unit_id, lesson.level_id)
  }

  return { status: newStatus }
}

/**
 * 课时完成后的级联更新
 */
async function onLessonCompleted(userId: string, unitId: string, levelId: string) {
  const completedInUnit = await progressRepo.countCompletedLessonsInUnit(userId, unitId)
  const unit = await courseRepo.findUnitById(unitId)
  if (!unit) return

  // 更新单元进度
  const unitStatus = completedInUnit >= unit.total_lessons ? 'completed' : 'in_progress'
  await progressRepo.upsertUnitProgress(userId, unitId, levelId, {
    completed_lessons: completedInUnit,
    total_lessons: unit.total_lessons,
    status: unitStatus,
    ...(unitStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
  })

  // 更新 Level 进度
  const totalCompleted = await progressRepo.countCompletedLessons(userId)
  const level = await courseRepo.findLevelById(levelId)
  if (!level) return

  // 查该 level 下所有课时完成数
  const { data: levelLessons } = await (await import('../core/supabase')).supabaseAdmin
    .from('user_lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .eq('status', 'completed')

  const levelCompleted = levelLessons as unknown as number ?? 0

  await progressRepo.upsertCourseProgress(userId, levelId, {
    completed_lessons: typeof levelCompleted === 'number' ? levelCompleted : 0,
    total_lessons: level.total_lessons,
    progress_percentage: level.total_lessons > 0
      ? Math.round((typeof levelCompleted === 'number' ? levelCompleted : 0) / level.total_lessons * 10000) / 100
      : 0,
  })
}

/**
 * 查询用户学习概览
 */
export async function getProgressOverview(userId: string): Promise<ProgressOverview> {
  const [allProgress, totalCompleted, totalSeconds] = await Promise.all([
    progressRepo.findAllCourseProgress(userId),
    progressRepo.countCompletedLessons(userId),
    progressRepo.sumStudySeconds(userId),
  ])

  const currentLevel = allProgress.find(p => p.status === 'in_progress')
  const levels = await courseRepo.findAllLevels()
  const levelMap = new Map(levels.map(l => [l.id, l]))

  const levelsProgress = allProgress.map(p => {
    const l = levelMap.get(p.level_id)
    return {
      level_number: l?.level_number ?? 0,
      status: p.status,
      progress: Number(p.progress_percentage) || 0,
    }
  }).sort((a, b) => a.level_number - b.level_number)

  const currentLevelData = currentLevel ? levelMap.get(currentLevel.level_id) : null

  return {
    current_level: currentLevelData?.level_number ?? null,
    current_level_progress: Number(currentLevel?.progress_percentage) || 0,
    total_completed_lessons: totalCompleted,
    total_study_hours: Math.round(totalSeconds / 3600 * 10) / 10,
    streak_days: 0, // P2: 需独立统计
    srs_due_today: 0, // 调用 SRS Service 获取
    levels_progress: levelsProgress,
  }
}

/**
 * 获取单元解锁状态
 */
export async function getUnlockStatus(userId: string, levelId: string): Promise<UnlockStatusItem[]> {
  const units = await courseRepo.findUnitsByLevelId(levelId)
  const unitProgress = await progressRepo.findUnitProgressByLevel(userId, levelId)
  const progressMap = new Map(unitProgress.map(p => [p.unit_id, p]))

  return units.map((unit, index) => {
    const prog = progressMap.get(unit.id)
    const prevUnit = index > 0 ? progressMap.get(units[index - 1].id) : null
    const isUnlocked = index === 0 || (prevUnit?.assessment_passed ?? false)

    return {
      unit_id: unit.id,
      unit_number: unit.unit_number,
      status: prog?.status ?? (isUnlocked ? 'unlocked' : 'locked'),
      is_unlocked: isUnlocked,
      assessment_passed: prog?.assessment_passed ?? false,
    }
  })
}

/**
 * 初始化用户课程进度
 */
export async function initializeProgress(userId: string, startLevel: number) {
  const level = await courseRepo.findLevelByNumber(startLevel)
  if (!level) throw NotFound('Level 不存在')

  // 幂等: 已有进度则跳过
  const existing = await progressRepo.findCourseProgress(userId, level.id)
  if (existing) return { message: '进度已初始化', level_number: startLevel }

  // 初始化 Level 进度
  await progressRepo.upsertCourseProgress(userId, level.id, {
    status: 'in_progress',
    total_lessons: level.total_lessons,
  })

  // 解锁第一个 Unit
  const units = await courseRepo.findUnitsByLevelId(level.id)
  if (units.length > 0) {
    await progressRepo.upsertUnitProgress(userId, units[0].id, level.id, {
      status: 'unlocked',
      total_lessons: units[0].total_lessons,
    })
  }

  return { message: '进度初始化成功', level_number: startLevel }
}
