import * as courseRepo from '../repositories/course-repository'
import type { LevelWithUserStatus, UnitWithProgress, LessonWithProgress, LevelRow } from '../models/course'
import { NotFound, Forbidden } from '../core/exceptions'

/**
 * 获取 Level 列表（含用户状态）
 */
export async function getLevelsWithUserStatus(userId: string): Promise<LevelWithUserStatus[]> {
  const [levels, purchases, progress] = await Promise.all([
    courseRepo.findAllLevels(),
    courseRepo.findUserActivePurchases(userId),
    courseRepo.findUserCourseProgress(userId),
  ])

  const purchaseMap = new Map(purchases.map(p => [p.level_id, p.expires_at]))
  const progressMap = new Map(progress.map(p => [p.level_id, p]))

  return levels.map(level => {
    const prog = progressMap.get(level.id)
    const isAccessible = level.is_free || purchaseMap.has(level.id)

    return {
      ...level,
      user_status: (prog?.status as LevelWithUserStatus['user_status']) ?? 'not_started',
      progress_percentage: prog?.progress_percentage ?? 0,
      completed_lessons: prog?.completed_lessons ?? 0,
      is_accessible: isAccessible,
      purchase_expires_at: purchaseMap.get(level.id) ?? null,
    }
  })
}

/**
 * 获取 Level 详情（单元列表含进度）
 */
export async function getUnitsWithProgress(userId: string, levelId: string): Promise<UnitWithProgress[]> {
  const level = await courseRepo.findLevelById(levelId)
  if (!level) throw NotFound('Level 不存在')

  const [units, unitProgress] = await Promise.all([
    courseRepo.findUnitsByLevelId(levelId),
    courseRepo.findUserUnitProgress(userId, levelId),
  ])

  const progressMap = new Map(unitProgress.map(p => [p.unit_id, p]))

  return units.map(unit => {
    const prog = progressMap.get(unit.id)
    return {
      ...unit,
      status: (prog?.status as UnitWithProgress['status']) ?? 'locked',
      completed_lessons: prog?.completed_lessons ?? 0,
      assessment_score: prog?.assessment_score ?? null,
      assessment_passed: prog?.assessment_passed ?? false,
    }
  })
}

/**
 * 获取 Unit 课时列表（含进度）
 */
export async function getLessonsWithProgress(userId: string, unitId: string): Promise<LessonWithProgress[]> {
  const unit = await courseRepo.findUnitById(unitId)
  if (!unit) throw NotFound('Unit 不存在')

  const [lessons, lessonProgress] = await Promise.all([
    courseRepo.findLessonsByUnitId(unitId),
    courseRepo.findUserLessonProgress(userId, unitId),
  ])

  const progressMap = new Map(lessonProgress.map(p => [p.lesson_id, p]))

  return lessons.map(lesson => {
    const prog = progressMap.get(lesson.id)
    return {
      ...lesson,
      status: (prog?.status as LessonWithProgress['status']) ?? 'not_started',
      resume_data: prog?.resume_data ?? null,
      total_study_seconds: prog?.total_study_seconds ?? 0,
    }
  })
}

/**
 * 获取 Lesson 详情（含权限检查）
 */
export async function getLessonDetail(userId: string, lessonId: string) {
  const lesson = await courseRepo.findLessonById(lessonId)
  if (!lesson) throw NotFound('课时不存在')

  // 权限检查
  await checkLevelAccess(userId, lesson.level_id)

  return lesson
}

/**
 * 获取 Level 内容预览（付费墙用）
 */
export async function getLevelPreview(levelId: string): Promise<LevelRow> {
  const level = await courseRepo.findLevelById(levelId)
  if (!level) throw NotFound('Level 不存在')
  return level
}

/**
 * 检查 Level 访问权限
 */
export async function checkLevelAccess(userId: string, levelId: string): Promise<void> {
  const level = await courseRepo.findLevelById(levelId)
  if (!level) throw NotFound('Level 不存在')

  if (level.is_free) return

  const purchases = await courseRepo.findUserActivePurchases(userId)
  const hasPurchase = purchases.some(p => p.level_id === levelId)

  if (!hasPurchase) {
    throw Forbidden('未购买该 Level，请先购买')
  }
}
