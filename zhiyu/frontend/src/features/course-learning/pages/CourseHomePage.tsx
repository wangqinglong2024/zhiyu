import { type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Zap, GraduationCap, ChevronRight, Star, Lock, LogIn } from 'lucide-react'
import { useLevels, useProgressOverview, useSrsStats, usePlacementHistory } from '../hooks/useCourse'
import { useLoginWallContext } from '../../auth/contexts/LoginWallContext'
import type { LevelWithStatus } from '../services/api'

export const CourseHomePage: FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, openAuthModal } = useLoginWallContext()

  if (!isAuthenticated) {
    return <LoginPrompt onLogin={() => openAuthModal({ type: 'navigate_tab', payload: { targetTab: '/courses' } })} />
  }

  return <AuthenticatedCourseHome navigate={navigate} />
}

const AuthenticatedCourseHome: FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => {
  const { data: levels, isLoading: levelsLoading, error: levelsError } = useLevels()
  const { data: overview } = useProgressOverview()
  const { data: srsStats } = useSrsStats()
  const { data: placement } = usePlacementHistory()

  if (levelsLoading) return <CourseHomeSkeleton />
  if (levelsError) return <ErrorState message={levelsError.message} />

  const hasPlacementResult = !!placement?.recommended_level

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* 标题 */}
      <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-1">系统课程</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">12 级进阶中文之旅</p>

      {/* 入学测试卡片 */}
      {!hasPlacementResult && <PlacementTestCard onStart={() => navigate('/courses/placement-test')} />}

      {/* 学习概览 */}
      {overview && overview.current_level && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">当前进度</span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              Level {overview.current_level}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--color-bg-secondary)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e11d48] to-[#0284c7] transition-all duration-500"
              style={{ width: `${overview.current_level_progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[var(--color-text-tertiary)]">
            <span>{overview.total_completed_lessons} 课时已完成</span>
            <span>{overview.total_study_hours}h 学习时长</span>
          </div>
        </div>
      )}

      {/* SRS 复习卡片 */}
      {srsStats && srsStats.today.total_due > 0 && (
        <SrsReviewCard
          dueCount={srsStats.today.total_due}
          reviewed={srsStats.today.reviewed}
          onStart={() => navigate('/courses/srs-review')}
        />
      )}

      {/* Level 地图 */}
      <div className="space-y-3">
        {levels?.map(level => (
          <LevelNode key={level.id} level={level} onClick={() => {
            if (level.is_accessible) {
              navigate(`/courses/levels/${level.id}`)
            } else {
              navigate(`/courses/paywall/${level.id}`)
            }
          }} />
        ))}
      </div>
    </div>
  )
}

// ===== 子组件 =====

const PlacementTestCard: FC<{ onStart: () => void }> = ({ onStart }) => (
  <button
    onClick={onStart}
    className="glass-card p-4 mb-6 w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e11d48] to-[#d97706] flex items-center justify-center shrink-0">
      <GraduationCap className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-sm">入学水平测试</p>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
        测试你的中文水平，找到最适合的起点
      </p>
    </div>
    <ChevronRight className="w-5 h-5 text-[var(--color-text-tertiary)]" />
  </button>
)

const SrsReviewCard: FC<{ dueCount: number; reviewed: number; onStart: () => void }> = ({ dueCount, reviewed, onStart }) => (
  <button
    onClick={onStart}
    className="glass-card p-4 mb-6 w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#06b6d4] flex items-center justify-center shrink-0">
      <Zap className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-sm">今日复习</p>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
        {dueCount} 项待复习 · 已完成 {reviewed}
      </p>
    </div>
    <ChevronRight className="w-5 h-5 text-[var(--color-text-tertiary)]" />
  </button>
)

const LevelNode: FC<{ level: LevelWithStatus; onClick: () => void }> = ({ level, onClick }) => {
  const statusColor = level.user_status === 'completed'
    ? 'from-[#22c55e] to-[#16a34a]'
    : level.user_status === 'in_progress'
    ? 'from-[#e11d48] to-[#0284c7]'
    : 'from-[var(--color-bg-tertiary)] to-[var(--color-bg-secondary)]'

  return (
    <button
      onClick={onClick}
      className="glass-card p-4 w-full text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${statusColor} flex items-center justify-center shrink-0 relative`}>
        {level.is_accessible ? (
          <span className="text-xl font-bold text-white">{level.level_number}</span>
        ) : (
          <Lock className="w-6 h-6 text-white/60" />
        )}
        {level.user_status === 'completed' && (
          <Star className="w-4 h-4 text-[#d97706] absolute -top-1 -right-1" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">L{level.level_number} · {level.title_zh}</p>
          {level.is_free && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-medium shrink-0">
              免费
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">{level.subtitle_zh}</p>
        {level.user_status !== 'not_started' && (
          <div className="mt-2 w-full h-1.5 rounded-full bg-[var(--color-bg-secondary)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e11d48] to-[#0284c7] transition-all"
              style={{ width: `${level.progress_percentage}%` }}
            />
          </div>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0" />
    </button>
  )
}

const CourseHomeSkeleton: FC = () => (
  <div className="min-h-screen px-4 pt-12 pb-24 animate-pulse">
    <div className="h-7 w-32 rounded bg-[var(--color-bg-tertiary)] mb-2" />
    <div className="h-4 w-48 rounded bg-[var(--color-bg-tertiary)] mb-6" />
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-tertiary)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-[var(--color-bg-tertiary)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--color-bg-tertiary)]" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const LoginPrompt: FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="min-h-screen px-4 pt-12 pb-24 flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e11d48] to-[#0284c7] flex items-center justify-center mb-6">
      <BookOpen className="w-8 h-8 text-white" />
    </div>
    <h1 className="text-xl font-bold mb-2">系统课程</h1>
    <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-[260px]">
      登录后即可开启 12 级进阶中文学习之旅
    </p>
    <button
      onClick={onLogin}
      className="glass-card px-6 py-3 flex items-center gap-2 active:scale-[0.98] transition-transform"
    >
      <LogIn className="w-5 h-5 text-[var(--color-accent-rose)]" />
      <span className="font-medium text-sm">登录 / 注册</span>
    </button>
  </div>
)

const ErrorState: FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen px-4 pt-12 pb-24 flex flex-col items-center justify-center text-center">
    <BookOpen className="w-12 h-12 text-[var(--color-text-tertiary)] mb-4" />
    <p className="text-sm text-[var(--color-text-secondary)]">加载失败</p>
    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{message}</p>
  </div>
)

CourseHomePage.displayName = 'CourseHomePage'
