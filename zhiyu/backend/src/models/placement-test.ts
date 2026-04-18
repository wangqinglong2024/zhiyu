import { z } from 'zod'

// ===== 入学测试行 =====
export interface PlacementTestRow {
  id: string
  user_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  total_questions: number
  correct_answers: number
  answers: unknown[]
  vocab_score: number
  reading_score: number
  grammar_score: number
  listening_score: number
  overall_accuracy: number | null
  recommended_level: number | null
  coin_reward_claimed: boolean
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ===== 题目行 =====
export interface PlacementQuestionRow {
  id: string
  module: 'character' | 'vocabulary' | 'reading' | 'hsk'
  difficulty_level: number
  question: Record<string, unknown>
  correct_answer: string
  explanation: Record<string, unknown> | null
  is_active: boolean
}

// ===== 提交答案 =====
export const SubmitAnswerSchema = z.object({
  previous_answer: z.string().min(1).max(10),
  previous_question_id: z.string().uuid(),
})

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>

// ===== 正确率 → Level 映射 =====
export function accuracyToLevel(accuracy: number, totalQuestions: number): number {
  // 前 10 题正确率 < 30% → L1
  if (totalQuestions <= 10 && accuracy < 30) return 1

  if (accuracy < 30) return 1
  if (accuracy < 46) return 1
  if (accuracy < 56) return 2
  if (accuracy < 66) return 3
  if (accuracy < 73) return 4
  if (accuracy < 79) return 5
  if (accuracy < 85) return 6
  if (accuracy < 89) return 7
  if (accuracy < 93) return 8
  if (accuracy < 97) return 9
  if (accuracy < 99) return 10
  return 11
}

// ===== 自适应终止条件判断 =====
export interface AdaptiveState {
  totalQuestions: number
  correctAnswers: number
  consecutiveCorrect: number
  consecutiveWrong: number
  currentDifficulty: number
}

export function shouldTerminate(state: AdaptiveState): boolean {
  const accuracy = state.totalQuestions > 0
    ? (state.correctAnswers / state.totalQuestions) * 100
    : 0

  // ① 已答 ≥ 30 题且置信度 ≥ 80%
  if (state.totalQuestions >= 30) {
    const variance = Math.abs(accuracy - 50)
    if (variance >= 15) return true // 简化置信度判断
  }

  // ② 已答 ≥ 60 题
  if (state.totalQuestions >= 60) return true

  // ③ 前 10 题正确率 < 30%（零基础快速检测）
  if (state.totalQuestions >= 10 && state.totalQuestions <= 12 && accuracy < 30) return true

  // ④ 前 15 题正确率 > 90% 且已达 L9+ 难度
  if (state.totalQuestions >= 15 && state.totalQuestions <= 18 && accuracy > 90 && state.currentDifficulty >= 9) return true

  return false
}

export function getNextDifficulty(state: AdaptiveState, isCorrect: boolean): number {
  let next = state.currentDifficulty

  if (isCorrect) {
    next += state.consecutiveCorrect >= 2 ? 2 : 1
  } else {
    next -= state.consecutiveWrong >= 2 ? 2 : 1
  }

  return Math.max(1, Math.min(12, next))
}
