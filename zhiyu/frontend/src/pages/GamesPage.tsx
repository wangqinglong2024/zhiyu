import type { FC } from 'react'

export const GamesPage: FC = () => {
  return (
    <div className="min-h-screen px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6">
        游戏模式
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 aspect-square flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-text-tertiary)] opacity-10" />
            <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-20 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

GamesPage.displayName = 'GamesPage'
