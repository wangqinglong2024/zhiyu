import type { FC } from 'react'

export const FirstLoadScreen: FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--bg-primary)]">
      {/* Logo 呼吸动画 */}
      <div className="animate-breathe mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-rose)] to-[var(--color-accent-sky)] flex items-center justify-center text-white text-2xl font-bold font-[var(--font-heading)]">
          知
        </div>
      </div>

      {/* 品牌文字 */}
      <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-8">
        知语 Zhiyu
      </p>

      {/* 进度条 */}
      <div className="w-48 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-rose)] to-[var(--color-accent-sky)] animate-loading-bar" />
      </div>

      <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
        探索中华之美
      </p>
    </div>
  )
}

FirstLoadScreen.displayName = 'FirstLoadScreen'
