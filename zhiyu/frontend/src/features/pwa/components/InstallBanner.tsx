import type { FC } from 'react'
import { Download, X } from 'lucide-react'
import { usePwaInstall } from '../hooks/use-pwa-install'

export const InstallBanner: FC = () => {
  const { shouldShowBanner, install, dismiss } = usePwaInstall()

  if (!shouldShowBanner) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 glass-elevated p-4 flex items-center gap-3 animate-slide-up"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="banner"
    >
      {/* App 图标 */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-rose-primary)] to-[var(--color-sky-primary)] flex items-center justify-center text-white font-bold text-lg shrink-0">
        知
      </div>

      {/* 文案 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">添加知语到主屏幕</p>
        <p className="text-xs text-[var(--text-secondary)]">获得更好的学习体验</p>
      </div>

      {/* 安装按钮 */}
      <button className="btn-primary px-4 py-2 text-xs shrink-0" onClick={install}>
        <Download size={14} />
        安装
      </button>

      {/* 关闭按钮 */}
      <button
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
        onClick={dismiss}
        aria-label="关闭"
      >
        <X size={16} />
      </button>
    </div>
  )
}

InstallBanner.displayName = 'InstallBanner'
