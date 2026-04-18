import type { FC } from 'react'
import { useLanguage } from '../../i18n/hooks/use-language'

interface FavoriteConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

const TEXTS: Record<string, { title: string; desc: string; confirm: string; cancel: string }> = {
  zh: { title: '确认取消收藏？', desc: '取消后可重新收藏', confirm: '确认取消', cancel: '取消' },
  en: { title: 'Remove from favorites?', desc: 'You can re-save it later', confirm: 'Remove', cancel: 'Cancel' },
  vi: { title: 'Bỏ lưu bài viết?', desc: 'Bạn có thể lưu lại sau', confirm: 'Bỏ lưu', cancel: 'Hủy' },
}

export const FavoriteConfirmDialog: FC<FavoriteConfirmDialogProps> = ({ open, onConfirm, onCancel }) => {
  const { uiLanguage } = useLanguage()
  if (!open) return null

  const t = TEXTS[uiLanguage] ?? TEXTS.zh!

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative glass-elevated rounded-3xl p-6 mx-6 max-w-sm w-full animate-fade-in">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] text-center">
          {t.title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mt-2">
          {t.desc}
        </p>

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2.5 rounded-full border border-[var(--glass-border)]
              text-[var(--color-text-secondary)] text-sm font-medium"
            onClick={onCancel}
          >
            {t.cancel}
          </button>
          <button
            className="flex-1 py-2.5 rounded-full bg-[var(--color-rose)] text-white text-sm font-medium"
            onClick={onConfirm}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

FavoriteConfirmDialog.displayName = 'FavoriteConfirmDialog'
