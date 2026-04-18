import type { FC } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

export const LoadingScreen: FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={28} className="animate-spin text-[var(--color-rose-primary)]" />
      {message && (
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      )}
    </div>
  )
}

LoadingScreen.displayName = 'LoadingScreen'
