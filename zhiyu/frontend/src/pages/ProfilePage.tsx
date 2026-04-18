import type { FC } from 'react'

export const ProfilePage: FC = () => {
  return (
    <div className="min-h-screen px-4 pt-12 pb-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--color-text-tertiary)] opacity-10" />
        <div>
          <div className="h-5 rounded bg-[var(--color-text-tertiary)] opacity-20 w-24 mb-2" />
          <div className="h-3 rounded bg-[var(--color-text-tertiary)] opacity-10 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between">
            <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-20 w-24" />
            <div className="h-4 rounded bg-[var(--color-text-tertiary)] opacity-10 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

ProfilePage.displayName = 'ProfilePage'
