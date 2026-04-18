import type { FC } from 'react'

export const DiscoverPage: FC = () => {
  return (
    <div className="min-h-screen px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6">
        发现中国
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-4 aspect-[4/3] flex items-end">
            <div className="w-full">
              <div className="h-3 rounded-full bg-[var(--color-text-tertiary)] opacity-20 mb-2 w-3/4" />
              <div className="h-2 rounded-full bg-[var(--color-text-tertiary)] opacity-10 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

DiscoverPage.displayName = 'DiscoverPage'
