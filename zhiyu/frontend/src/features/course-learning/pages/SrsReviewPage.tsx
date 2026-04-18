import { type FC, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, X, Zap, Trophy } from 'lucide-react'
import { useSrsDue, useSubmitReview, useSrsStats } from '../hooks/useCourse'
import type { SrsReviewItem, ReviewResult } from '../services/api'

export const SrsReviewPage: FC = () => {
  const navigate = useNavigate()
  const { data: dueData, isLoading } = useSrsDue()
  const submitReview = useSubmitReview()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [sessionResults, setSessionResults] = useState<Array<{ result: string; isGraduated: boolean }>>([])
  const startTimeRef = useRef(Date.now())

  const items = dueData?.items ?? []
  const currentItem = items[currentIndex]
  const isComplete = currentIndex >= items.length || items.length === 0

  const handleAnswer = useCallback((result: 'remembered' | 'forgotten') => {
    if (!currentItem) return
    const timeMs = Date.now() - startTimeRef.current

    submitReview.mutate(
      { itemId: currentItem.id, result, timeMs },
      {
        onSuccess: (data) => {
          setSessionResults(prev => [...prev, { result, isGraduated: data.is_graduated }])
          setShowBack(false)
          setCurrentIndex(prev => prev + 1)
          startTimeRef.current = Date.now()
        },
      },
    )
  }, [currentItem, submitReview])

  if (isLoading) return <ReviewSkeleton />

  if (isComplete) {
    return <ReviewCompletePage
      results={sessionResults}
      totalDue={dueData?.total_due ?? 0}
      onBack={() => navigate('/courses')}
    />
  }

  const front = currentItem.card_front as Record<string, unknown>
  const back = currentItem.card_back as Record<string, unknown>

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部 */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/courses')} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm flex-1">间隔复习</h1>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {currentIndex + 1}/{items.length}
        </span>
      </div>

      {/* 进度条 */}
      <div className="px-4 pt-2">
        <div className="w-full h-1 rounded-full bg-[var(--color-bg-secondary)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0284c7] to-[#06b6d4] transition-all duration-300"
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 卡片区域 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="glass-card p-6 w-full max-w-sm min-h-[280px] flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => !showBack && setShowBack(true)}
        >
          {/* 正面 */}
          <div className="mb-4">
            {front.type === 'vocabulary' ? (
              <>
                <p className="text-3xl font-bold mb-2">{String(front.word || '')}</p>
                {front.pinyin && (
                  <p className="text-sm text-[#e11d48]">{String(front.pinyin)}</p>
                )}
              </>
            ) : (
              <p className="text-xl font-semibold">{JSON.stringify(front)}</p>
            )}
          </div>

          {/* 反面 */}
          {showBack ? (
            <div className="border-t border-[var(--color-border)] pt-4 w-full space-y-2">
              {back.en && <p className="text-sm">{String(back.en)}</p>}
              {back.vi && <p className="text-xs text-[var(--color-text-tertiary)]">{String(back.vi)}</p>}
              {back.example && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">{String(back.example)}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-4">点击翻转</p>
          )}

          {/* 阶段指示 */}
          <div className="mt-4 flex items-center gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i <= currentItem.interval_stage
                    ? 'bg-[#0284c7]'
                    : 'bg-[var(--color-bg-tertiary)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      {showBack && (
        <div className="sticky bottom-0 p-4 glass-card flex gap-3">
          <button
            onClick={() => handleAnswer('forgotten')}
            disabled={submitReview.isPending}
            className="flex-1 py-3 rounded-xl bg-[#ef4444]/10 text-[#ef4444] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <X className="w-4 h-4" />
            忘记了
          </button>
          <button
            onClick={() => handleAnswer('remembered')}
            disabled={submitReview.isPending}
            className="flex-1 py-3 rounded-xl bg-[#22c55e]/10 text-[#22c55e] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Check className="w-4 h-4" />
            记住了
          </button>
        </div>
      )}
    </div>
  )
}

const ReviewCompletePage: FC<{
  results: Array<{ result: string; isGraduated: boolean }>
  totalDue: number
  onBack: () => void
}> = ({ results, totalDue, onBack }) => {
  const correct = results.filter(r => r.result === 'remembered').length
  const graduated = results.filter(r => r.isGraduated).length
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d97706] to-[#e11d48] flex items-center justify-center mb-6">
        <Trophy className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-xl font-bold mb-2">复习完成！</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        本轮复习 {results.length} 项
      </p>

      <div className="glass-card p-4 w-full max-w-xs space-y-3 mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-tertiary)]">正确率</span>
          <span className="font-semibold">{accuracy}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-tertiary)]">记住</span>
          <span className="font-semibold text-[#22c55e]">{correct}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-tertiary)]">忘记</span>
          <span className="font-semibold text-[#ef4444]">{results.length - correct}</span>
        </div>
        {graduated > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-tertiary)]">毕业</span>
            <span className="font-semibold text-[#d97706]">{graduated}</span>
          </div>
        )}
        {totalDue > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-tertiary)]">剩余待复习</span>
            <span className="font-semibold">{totalDue}</span>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#0284c7] text-white font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        返回课程
      </button>
    </div>
  )
}

const ReviewSkeleton: FC = () => (
  <div className="min-h-screen animate-pulse flex flex-col items-center justify-center px-4">
    <div className="glass-card p-6 w-full max-w-sm h-[280px] rounded-2xl bg-[var(--color-bg-tertiary)]" />
  </div>
)

SrsReviewPage.displayName = 'SrsReviewPage'
