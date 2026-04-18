import { type FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Check, GraduationCap } from 'lucide-react'
import { useStartPlacementTest, useSubmitPlacementAnswer, useCompletePlacementTest, useInitializeProgress } from '../hooks/useCourse'

export const PlacementTestPage: FC = () => {
  const navigate = useNavigate()
  const startTest = useStartPlacementTest()
  const submitAnswer = useSubmitPlacementAnswer()
  const completeTest = useCompletePlacementTest()
  const initProgress = useInitializeProgress()

  const [testId, setTestId] = useState<string | null>(null)
  const [question, setQuestion] = useState<Record<string, unknown> | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [result, setResult] = useState<{ recommended_level: number; overall_accuracy: number } | null>(null)
  const [phase, setPhase] = useState<'intro' | 'testing' | 'result'>('intro')

  const handleStart = () => {
    startTest.mutate(undefined, {
      onSuccess: (data) => {
        setTestId(data.test_id)
        setQuestion(data.question as Record<string, unknown>)
        setQuestionCount(1)
        setPhase('testing')
      },
    })
  }

  const handleSubmit = () => {
    if (!testId || !question || !selectedAnswer) return

    submitAnswer.mutate(
      { testId, questionId: String(question.question_id), answer: selectedAnswer },
      {
        onSuccess: (data) => {
          if (data.finished || !data.question) {
            // 完成测试
            completeTest.mutate(testId, {
              onSuccess: (r) => {
                setResult({ recommended_level: r.recommended_level, overall_accuracy: r.overall_accuracy })
                setPhase('result')
              },
            })
          } else {
            setQuestion(data.question as Record<string, unknown>)
            setSelectedAnswer(null)
            setQuestionCount(prev => prev + 1)
          }
        },
      },
    )
  }

  const handleAcceptLevel = () => {
    if (!result) return
    initProgress.mutate(result.recommended_level, {
      onSuccess: () => navigate('/courses', { replace: true }),
    })
  }

  // ===== 介绍页 =====
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-sm">入学水平测试</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e11d48] to-[#d97706] flex items-center justify-center mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">找到你的起点</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
            通过自适应算法，快速评估你的中文水平
          </p>
          <ul className="text-xs text-[var(--color-text-tertiary)] space-y-1 mb-8">
            <li>• 约 10-15 道题目</li>
            <li>• 覆盖听说读写</li>
            <li>• 完成可获 100 知语币</li>
          </ul>
          <button
            onClick={handleStart}
            disabled={startTest.isPending}
            className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#0284c7] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {startTest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '开始测试'}
          </button>
        </div>
      </div>
    )
  }

  // ===== 答题中 =====
  if (phase === 'testing' && question) {
    const q = question.question as Record<string, unknown> | undefined
    const options = (q?.options as string[]) ?? []
    const stem = String(q?.stem || q?.text || JSON.stringify(q))

    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/courses')} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-[var(--color-text-tertiary)]">第 {questionCount} 题</span>
          <div className="w-5" />
        </div>

        <div className="flex-1 px-4 py-6 flex flex-col">
          <div className="glass-card p-4 mb-6">
            <p className="text-sm leading-relaxed">{stem}</p>
          </div>

          <div className="space-y-2 flex-1">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(opt)}
                className={`glass-card p-3 w-full text-left text-sm transition-all ${
                  selectedAnswer === opt
                    ? 'ring-2 ring-[#0284c7] bg-[#0284c7]/5'
                    : 'active:scale-[0.98]'
                }`}
              >
                <span className="text-xs text-[var(--color-text-tertiary)] mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>

          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitAnswer.isPending || completeTest.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#0284c7] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {(submitAnswer.isPending || completeTest.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '提交'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== 结果页 =====
  if (phase === 'result' && result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#22c55e] to-[#0284c7] flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">测试完成！</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          正确率 {result.overall_accuracy}%
        </p>

        <div className="glass-card p-6 w-full max-w-xs mb-8">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">推荐起始级别</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-[#e11d48] to-[#0284c7] bg-clip-text text-transparent">
            Level {result.recommended_level}
          </p>
        </div>

        <button
          onClick={handleAcceptLevel}
          disabled={initProgress.isPending}
          className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#0284c7] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          {initProgress.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '从这里开始学习'}
        </button>

        <button
          onClick={() => navigate('/courses', { replace: true })}
          className="mt-3 text-xs text-[var(--color-text-tertiary)]"
        >
          稍后决定
        </button>
      </div>
    )
  }

  return null
}

PlacementTestPage.displayName = 'PlacementTestPage'
