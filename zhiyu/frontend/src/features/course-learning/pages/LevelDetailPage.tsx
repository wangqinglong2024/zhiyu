import { type FC, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Lock, Check, BookOpen } from 'lucide-react'
import { useUnits, useUnlockStatus, useLevelPreview } from '../hooks/useCourse'
import type { UnitWithProgress } from '../services/api'

export const LevelDetailPage: FC = () => {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const { data: level } = useLevelPreview(levelId!)
  const { data: units, isLoading, error } = useUnits(levelId!)
  const { data: unlockStatus } = useUnlockStatus(levelId!)

  const unlockMap = new Map(unlockStatus?.map(u => [u.unit_id, u]) ?? [])

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/courses')} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">
            {level ? `Level ${level.level_number} · ${level.title_zh}` : '...'}
          </h1>
          {level && (
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">{level.subtitle_zh}</p>
          )}
        </div>
      </div>

      {/* Level 信息 */}
      {level && (
        <div className="px-4 py-4">
          <div className="glass-card p-4">
            <p className="text-sm text-[var(--color-text-secondary)]">{level.description_zh}</p>
            <div className="flex gap-4 mt-3 text-xs text-[var(--color-text-tertiary)]">
              <span>{level.total_units} 单元</span>
              <span>{level.total_lessons} 课时</span>
              <span>HSK {level.hsk_level}</span>
            </div>
          </div>
        </div>
      )}

      {/* 单元列表 */}
      <div className="px-4 space-y-3">
        {isLoading && <UnitsSkeleton />}
        {error && <p className="text-center text-sm text-[var(--color-text-tertiary)]">加载失败</p>}
        {units?.map(unit => {
          const unlock = unlockMap.get(unit.id)
          const isLocked = unlock ? !unlock.is_unlocked : unit.status === 'locked'

          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              isLocked={isLocked}
              onClick={() => {
                if (!isLocked) navigate(`/courses/units/${unit.id}/lessons`)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

const UnitCard: FC<{ unit: UnitWithProgress; isLocked: boolean; onClick: () => void }> = ({ unit, isLocked, onClick }) => {
  const progress = unit.total_lessons > 0
    ? Math.round((unit.completed_lessons / unit.total_lessons) * 100)
    : 0

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`glass-card p-4 w-full text-left flex items-center gap-3 transition-all ${
        isLocked ? 'opacity-50' : 'active:scale-[0.98]'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        unit.status === 'completed'
          ? 'bg-[#22c55e]/10'
          : isLocked
          ? 'bg-[var(--color-bg-tertiary)]'
          : 'bg-[#e11d48]/10'
      }`}>
        {isLocked ? (
          <Lock className="w-5 h-5 text-[var(--color-text-tertiary)]" />
        ) : unit.status === 'completed' ? (
          <Check className="w-5 h-5 text-[#22c55e]" />
        ) : (
          <BookOpen className="w-5 h-5 text-[#e11d48]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">Unit {unit.unit_number} · {unit.title_zh}</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
          {unit.completed_lessons}/{unit.total_lessons} 课时
        </p>
        {!isLocked && unit.status !== 'completed' && progress > 0 && (
          <div className="mt-2 w-full h-1 rounded-full bg-[var(--color-bg-secondary)]">
            <div
              className="h-full rounded-full bg-[#e11d48] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {!isLocked && <ChevronRight className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0" />}
    </button>
  )
}

const UnitsSkeleton: FC = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--color-bg-tertiary)]" />
          <div className="h-3 w-1/3 rounded bg-[var(--color-bg-tertiary)]" />
        </div>
      </div>
    ))}
  </div>
)

LevelDetailPage.displayName = 'LevelDetailPage'
