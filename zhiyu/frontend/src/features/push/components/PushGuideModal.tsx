import type { FC } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushPermission } from '../hooks/use-push-permission'

interface PushGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export const PushGuideModal: FC<PushGuideModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { requestPermission } = usePushPermission()

  if (!isOpen) return null

  const handleEnable = async () => {
    const success = await requestPermission()
    if (success) {
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="推送通知引导">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" onClick={onClose} aria-hidden="true" />

      {/* Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-[32px] glass-elevated"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* 拖拽条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-[var(--text-tertiary)] opacity-40" />
        </div>

        {/* 关闭按钮 */}
        <button
          className="absolute top-4 right-4 p-1 text-[var(--text-tertiary)]"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        <div className="px-6 py-4 text-center">
          {/* 图标 */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-rose-primary)] to-[var(--color-sky-primary)] flex items-center justify-center">
            <Bell size={28} className="text-white" />
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">开启通知提醒</h3>

          {/* 说明 */}
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            及时获取学习提醒、课程更新和活动通知，<br />
            不错过任何精彩内容
          </p>

          {/* 通知类型预览 */}
          <div className="flex justify-center gap-4 mb-6">
            {['学习提醒', '课程更新', '活动通知'].map(label => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 mx-auto mb-1 rounded-xl bg-[var(--glass-bg)] flex items-center justify-center text-sm">
                  📚
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
              </div>
            ))}
          </div>

          {/* 按钮 */}
          <button className="btn-primary w-full mb-3" onClick={handleEnable}>
            开启通知
          </button>
          <button
            className="w-full py-3 text-sm text-[var(--text-secondary)]"
            onClick={onClose}
          >
            暂不开启
          </button>
        </div>
      </div>
    </div>
  )
}

PushGuideModal.displayName = 'PushGuideModal'
