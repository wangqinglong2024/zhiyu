import type { FC } from 'react'

export const CoursesPage: FC = () => {
  return (
    <div className="min-h-screen px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6">
        系统课程
      </h1>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-[var(--color-text-tertiary)] opacity-10 shrink-0" />
            <div className="flex-1">
              <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-20 mb-2 w-2/3" />
              <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-full" />
              <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 mt-1 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

CoursesPage.displayName = 'CoursesPage'
