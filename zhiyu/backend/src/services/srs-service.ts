import * as srsRepo from '../repositories/srs-repository'
import { calculateNextReview, checkOverdueReset, SRS_INTERVALS } from './srs-algorithm'
import { NotFound, BadRequest } from '../core/exceptions'
import { AppException } from '../core/exceptions'
import type { SrsStats, ReviewResultResponse, AddReviewItemInput, SubmitReviewInput } from '../models/srs'

const DAILY_MAX = 50

/**
 * 获取今日待复习项目
 */
export async function getDueItems(userId: string, limit: number, module?: string) {
  const todayReviewed = await srsRepo.countTodayReviewed(userId)
  if (todayReviewed >= DAILY_MAX) {
    return { items: [], total_due: 0, daily_remaining: 0, daily_max: DAILY_MAX }
  }

  const remaining = DAILY_MAX - todayReviewed
  const actualLimit = Math.min(limit, remaining)

  const items = await srsRepo.findDueItems(userId, actualLimit, module)

  // 超期重置
  for (const item of items) {
    const nextReview = new Date(item.next_review_at)
    if (checkOverdueReset(nextReview)) {
      await srsRepo.updateReviewItem(item.id, { interval_stage: 0 })
      item.interval_stage = 0
    }
  }

  const totalDue = await srsRepo.countTotalDue(userId)

  return {
    items: items.map(item => ({
      id: item.id,
      source_type: item.source_type,
      source_id: item.source_id,
      card_front: item.card_front,
      card_back: item.card_back,
      interval_stage: item.interval_stage,
      next_interval_days: SRS_INTERVALS[Math.min(item.interval_stage, SRS_INTERVALS.length - 1)],
      correct_streak: item.correct_streak,
      is_overdue: new Date(item.next_review_at) < new Date(),
      overdue_days: Math.max(0, Math.floor((Date.now() - new Date(item.next_review_at).getTime()) / (24 * 60 * 60 * 1000))),
    })),
    total_due: totalDue,
    daily_remaining: remaining,
    daily_max: DAILY_MAX,
  }
}

/**
 * 提交复习结果
 */
export async function submitReview(userId: string, itemId: string, input: SubmitReviewInput): Promise<ReviewResultResponse> {
  const item = await srsRepo.findReviewItemById(itemId)
  if (!item) throw NotFound('复习项不存在')
  if (item.user_id !== userId) throw NotFound('复习项不存在')
  if (item.status !== 'active') throw BadRequest('该复习项已毕业或暂停')

  const result = calculateNextReview(
    item.interval_stage,
    item.correct_streak,
    item.wrong_streak,
    input.result,
  )

  // 更新复习项
  const updates: Record<string, unknown> = {
    interval_stage: result.newStage,
    next_review_at: result.nextReviewAt.toISOString(),
    last_reviewed_at: new Date().toISOString(),
    correct_streak: result.correctStreak,
    wrong_streak: result.wrongStreak,
    total_reviews: item.total_reviews + 1,
    ...(input.result === 'remembered'
      ? { total_correct: item.total_correct + 1 }
      : { total_wrong: item.total_wrong + 1 }),
  }

  if (result.isGraduated) {
    updates.status = 'graduated'
    updates.graduated_at = new Date().toISOString()
  }

  await srsRepo.updateReviewItem(itemId, updates)

  // 记录复习日志
  await srsRepo.createReviewLog({
    user_id: userId,
    review_item_id: itemId,
    result: input.result,
    interval_stage_before: item.interval_stage,
    interval_stage_after: result.newStage,
    response_time_ms: input.time_ms,
  })

  const todayReviewed = await srsRepo.countTodayReviewed(userId)

  return {
    new_interval_stage: result.newStage,
    next_review_at: result.nextReviewAt.toISOString(),
    next_interval_days: SRS_INTERVALS[Math.min(result.newStage, SRS_INTERVALS.length - 1)],
    correct_streak: result.correctStreak,
    is_graduated: result.isGraduated,
    daily_reviewed: todayReviewed,
    daily_remaining: Math.max(0, DAILY_MAX - todayReviewed),
  }
}

/**
 * 获取复习统计
 */
export async function getStats(userId: string): Promise<SrsStats> {
  const [totalDue, todayReviewed, todayCorrect, statusCounts] = await Promise.all([
    srsRepo.countTotalDue(userId),
    srsRepo.countTodayReviewed(userId),
    srsRepo.countTodayCorrect(userId),
    srsRepo.countItemsByStatus(userId),
  ])

  const todayAccuracy = todayReviewed > 0
    ? Math.round((todayCorrect / todayReviewed) * 1000) / 10
    : 0

  const totalItems = (statusCounts.active ?? 0) + (statusCounts.graduated ?? 0) + (statusCounts.suspended ?? 0)

  return {
    today: {
      total_due: totalDue,
      reviewed: todayReviewed,
      remaining: Math.max(0, Math.min(totalDue, DAILY_MAX) - todayReviewed),
      accuracy: todayAccuracy,
      daily_limit: DAILY_MAX,
    },
    overall: {
      total_items: totalItems,
      active: statusCounts.active ?? 0,
      graduated: statusCounts.graduated ?? 0,
      suspended: statusCounts.suspended ?? 0,
      average_accuracy: 0, // P2: 需聚合历史数据
    },
    streak: {
      current_days: 0, // P2: 需独立统计
      longest_days: 0,
    },
  }
}

/**
 * 手动添加复习项
 */
export async function addReviewItem(userId: string, input: AddReviewItemInput) {
  // 防重复
  const existing = await srsRepo.findActiveItemBySource(userId, input.source_type, input.source_id)
  if (existing) {
    throw new AppException(409, 40901, '该复习项已存在')
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  return srsRepo.createReviewItem({
    user_id: userId,
    source_type: input.source_type,
    source_id: input.source_id,
    lesson_id: input.lesson_id ?? null,
    card_front: input.card_front,
    card_back: input.card_back,
    interval_stage: 0,
    next_review_at: tomorrow.toISOString(),
    status: 'active',
  })
}

/**
 * 批量添加课时词汇到 SRS（课时完成后调用）
 */
export async function addVocabFromLesson(userId: string, lessonId: string, vocabulary: unknown[]) {
  for (const vocab of vocabulary) {
    const v = vocab as Record<string, unknown>
    const sourceId = `vocab-${lessonId}-${v.word || v.hanzi || ''}`

    try {
      await addReviewItem(userId, {
        source_type: 'vocabulary',
        source_id: sourceId,
        lesson_id: lessonId,
        card_front: { type: 'vocabulary', word: v.word || v.hanzi, pinyin: v.pinyin },
        card_back: { en: v.en, vi: v.vi, example: v.example_zh, audio_url: v.audio_url },
      })
    } catch {
      // 已存在则跳过
    }
  }
}
