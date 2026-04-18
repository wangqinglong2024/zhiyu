import type { FC } from 'react'
import { useSwUpdate } from '../hooks/use-sw-update'

export const UpdateBanner: FC = () => {
  const { hasUpdate, applyUpdate } = useSwUpdate()

  if (!hasUpdate) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[90] flex items-center justify-center gap-3 py-2.5 px-4 bg-[var(--color-sky-primary)] text-white text-sm font-medium animate-slide-down"
      style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}
      role="alert"
    >
      <span>有新版本可用</span>
      <button
        className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold hover:bg-white/30 transition-colors"
        onClick={applyUpdate}
      >
        立即更新
      </button>
    </div>
  )
}

UpdateBanner.displayName = 'UpdateBanner'
