/**
 * SRS 间隔复习纯算法 — 便于单元测试
 */

export const SRS_INTERVALS = [1, 2, 4, 7, 15, 30] as const

export interface SrsUpdateResult {
  newStage: number
  nextReviewAt: Date
  correctStreak: number
  wrongStreak: number
  isGraduated: boolean
}

export function calculateNextReview(
  currentStage: number,
  correctStreak: number,
  wrongStreak: number,
  result: 'remembered' | 'forgotten',
  graduationStreak: number = 6,
): SrsUpdateResult {
  let newStage = currentStage
  let newCorrectStreak = correctStreak
  let newWrongStreak = wrongStreak

  if (result === 'remembered') {
    newCorrectStreak += 1
    newWrongStreak = 0
    newStage = Math.min(currentStage + 1, SRS_INTERVALS.length - 1)
  } else {
    newWrongStreak += 1
    newCorrectStreak = 0
    // 连续 3 次忘记 → 重置
    if (newWrongStreak >= 3) {
      newStage = 0
    } else {
      newStage = Math.max(currentStage - 1, 0)
    }
  }

  const isGraduated = newCorrectStreak >= graduationStreak

  const intervalDays = SRS_INTERVALS[Math.min(newStage, SRS_INTERVALS.length - 1)]
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays)
  nextReviewAt.setHours(0, 0, 0, 0) // 对齐到当日零点

  return {
    newStage,
    nextReviewAt,
    correctStreak: newCorrectStreak,
    wrongStreak: newWrongStreak,
    isGraduated,
  }
}

/**
 * 检查是否超期需要重置
 */
export function checkOverdueReset(
  nextReviewAt: Date,
  overdueResetDays: number = 7,
): boolean {
  const now = new Date()
  const overdueDays = Math.floor((now.getTime() - nextReviewAt.getTime()) / (24 * 60 * 60 * 1000))
  return overdueDays >= overdueResetDays
}
