import { type FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Check, Clock } from 'lucide-react'
import { useLessons } from '../hooks/useCourse'
import type { LessonWithProgress } from '../services/api'

export const LessonListPage: FC = () => {
  const { unitId } = useParams<{ unitId: string }>()
  const navigate = useNavigate()
  const { data: lessons, isLoading, error } = useLessons(unitId!)

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm">课时列表</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {isLoading && <LessonsSkeleton />}
        {error && <p className="text-center text-sm text-[var(--color-text-tertiary)]">加载失败</p>}
        {lessons?.map(lesson => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            onClick={() => navigate(`/courses/lessons/${lesson.id}`)}
          />
        ))}
      </div>
    </div>
  )
}

const LessonRow: FC<{ lesson: LessonWithProgress; onClick: () => void }> = ({ lesson, onClick }) => {
  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m`
  }

  return (
    <button
      onClick={onClick}
      className="glass-card p-3 w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        lesson.status === 'completed'
          ? 'bg-[#22c55e]/10'
          : lesson.status === 'in_progress'
          ? 'bg-[#0284c7]/10'
          : 'bg-[var(--color-bg-tertiary)]'
      }`}>
        {lesson.status === 'completed' ? (
          <Check className="w-4 h-4 text-[#22c55e]" />
        ) : lesson.status === 'in_progress' ? (
          <Play className="w-4 h-4 text-[#0284c7]" />
        ) : (
          <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{lesson.lesson_number}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{lesson.title_zh}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">{lesson.lesson_type}</span>
          {lesson.total_study_seconds > 0 && (
            <span className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {formatTime(lesson.total_study_seconds)}
            </span>
          )}
        </div>
      </div>

      {lesson.status === 'in_progress' && lesson.resume_data && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0284c7]/10 text-[#0284c7] font-medium shrink-0">
          继续
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
    </button>
  )
}

const LessonsSkeleton: FC = () => (
  <div className="space-y-2 animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="glass-card p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-2/3 rounded bg-[var(--color-bg-tertiary)]" />
          <div className="h-3 w-1/4 rounded bg-[var(--color-bg-tertiary)]" />
        </div>
      </div>
    ))}
  </div>
)

LessonListPage.displayName = 'LessonListPage'
