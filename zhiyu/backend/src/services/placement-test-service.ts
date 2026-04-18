import * as ptRepo from '../repositories/placement-test-repository'
import { NotFound, BadRequest } from '../core/exceptions'
import {
  accuracyToLevel,
  shouldTerminate,
  getNextDifficulty,
  type AdaptiveState,
} from '../models/placement-test'

const STARTING_DIFFICULTY = 3
const COIN_REWARD = 100

/**
 * 开始入学测试
 */
export async function startTest(userId: string) {
  // 检查是否有进行中的测试
  const inProgress = await ptRepo.findUserInProgressTest(userId)
  if (inProgress) {
    // 返回已有测试
    const question = await getNextQuestion(inProgress.id, STARTING_DIFFICULTY, [])
    return { test_id: inProgress.id, question }
  }

  // 创建新测试
  const test = await ptRepo.createTest(userId)

  // 获取第一道题（难度 L3）
  const question = await getNextQuestion(test.id, STARTING_DIFFICULTY, [])

  return { test_id: test.id, question }
}

/**
 * 提交答案并获取下一题
 */
export async function submitAndGetNext(
  userId: string,
  testId: string,
  previousAnswer: string,
  previousQuestionId: string,
) {
  const test = await ptRepo.findTestById(testId)
  if (!test) throw NotFound('测试不存在')
  if (test.user_id !== userId) throw NotFound('测试不存在')
  if (test.status !== 'in_progress') throw BadRequest('测试已结束')

  // 查找题目验证答案
  const questions = await ptRepo.findQuestionsByDifficulty(1, [], 100) // 获取全部题目用于查找
  // 实际应按 ID 查，这里简化
  const answers = (test.answers as unknown[]) || []
  const prevQuestion = answers.length > 0 ? null : null // 从题库查找

  // 计算本题是否正确
  // 简化: 使用数据库查找题目
  const { data: qRow } = await (await import('../core/supabase')).supabaseAdmin
    .from('placement_test_questions')
    .select('*')
    .eq('id', previousQuestionId)
    .single()

  const isCorrect = qRow?.correct_answer === previousAnswer

  // 更新测试数据
  const newAnswers = [
    ...answers,
    {
      question_id: previousQuestionId,
      level_difficulty: qRow?.difficulty_level ?? STARTING_DIFFICULTY,
      is_correct: isCorrect,
      answer: previousAnswer,
    },
  ]

  const correctCount = newAnswers.filter((a: any) => a.is_correct).length
  const totalQuestions = newAnswers.length

  // 计算自适应状态
  let consecutiveCorrect = 0
  let consecutiveWrong = 0
  for (let i = newAnswers.length - 1; i >= 0; i--) {
    if ((newAnswers[i] as any).is_correct) {
      if (consecutiveWrong > 0) break
      consecutiveCorrect++
    } else {
      if (consecutiveCorrect > 0) break
      consecutiveWrong++
    }
  }

  const currentDifficulty = (qRow?.difficulty_level ?? STARTING_DIFFICULTY)
  const nextDifficulty = getNextDifficulty(
    {
      totalQuestions,
      correctAnswers: correctCount,
      consecutiveCorrect: isCorrect ? consecutiveCorrect : 0,
      consecutiveWrong: isCorrect ? 0 : consecutiveWrong,
      currentDifficulty,
    },
    isCorrect,
  )

  // 更新测试记录
  await ptRepo.updateTest(testId, {
    total_questions: totalQuestions,
    correct_answers: correctCount,
    answers: newAnswers,
  })

  // 检查终止条件
  const state: AdaptiveState = {
    totalQuestions,
    correctAnswers: correctCount,
    consecutiveCorrect: isCorrect ? consecutiveCorrect : 0,
    consecutiveWrong: isCorrect ? 0 : consecutiveWrong,
    currentDifficulty: nextDifficulty,
  }

  if (shouldTerminate(state)) {
    return { finished: true, test_id: testId }
  }

  // 获取下一题
  const answeredIds = newAnswers.map((a: any) => a.question_id)
  const question = await getNextQuestion(testId, nextDifficulty, answeredIds)

  return { finished: false, test_id: testId, question }
}

/**
 * 完成测试
 */
export async function completeTest(userId: string, testId: string) {
  const test = await ptRepo.findTestById(testId)
  if (!test) throw NotFound('测试不存在')
  if (test.user_id !== userId) throw NotFound('测试不存在')

  if (test.status === 'completed') {
    return {
      recommended_level: test.recommended_level,
      overall_accuracy: test.overall_accuracy,
      coin_reward_claimed: test.coin_reward_claimed,
    }
  }

  const accuracy = test.total_questions > 0
    ? Math.round((test.correct_answers / test.total_questions) * 10000) / 100
    : 0

  const recommendedLevel = accuracyToLevel(accuracy, test.total_questions)

  const updates: Record<string, unknown> = {
    status: 'completed',
    overall_accuracy: accuracy,
    recommended_level: recommendedLevel,
    completed_at: new Date().toISOString(),
  }

  // 首次完成发放奖励
  if (!test.coin_reward_claimed) {
    updates.coin_reward_claimed = true
    // TODO: 调用知语币 Service 发放 100 币
  }

  await ptRepo.updateTest(testId, updates)

  return {
    recommended_level: recommendedLevel,
    overall_accuracy: accuracy,
    coin_reward_claimed: true,
  }
}

/**
 * 获取测试历史
 */
export async function getTestHistory(userId: string) {
  const test = await ptRepo.findLatestCompletedTest(userId)
  if (!test) return null

  return {
    test_id: test.id,
    recommended_level: test.recommended_level,
    overall_accuracy: test.overall_accuracy,
    total_questions: test.total_questions,
    correct_answers: test.correct_answers,
    coin_reward_claimed: test.coin_reward_claimed,
    completed_at: test.completed_at,
  }
}

// ===== 内部辅助 =====

async function getNextQuestion(testId: string, difficulty: number, excludeIds: string[]) {
  // 尝试当前难度
  let questions = await ptRepo.findQuestionsByDifficulty(difficulty, excludeIds, 1)

  // 当前难度没题，尝试相邻难度
  if (questions.length === 0 && difficulty > 1) {
    questions = await ptRepo.findQuestionsByDifficulty(difficulty - 1, excludeIds, 1)
  }
  if (questions.length === 0 && difficulty < 12) {
    questions = await ptRepo.findQuestionsByDifficulty(difficulty + 1, excludeIds, 1)
  }

  if (questions.length === 0) {
    return null // 题库耗尽
  }

  const q = questions[0]
  return {
    question_id: q.id,
    module: q.module,
    difficulty_level: q.difficulty_level,
    question: q.question,
  }
}
