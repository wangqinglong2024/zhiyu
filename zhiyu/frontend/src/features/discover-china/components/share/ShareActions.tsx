import { type FC, useMemo, useCallback } from 'react'
import { Download, Share } from 'lucide-react'
import { useLanguage } from '../../../i18n/hooks/use-language'

interface ShareActionsProps {
  imageBlob: Blob
  title: string
}

const SAVE_LABELS: Record<string, string> = {
  zh: '保存到相册',
  en: 'Save to Photos',
  vi: 'Lưu vào ảnh',
}

const SHARE_LABELS: Record<string, string> = {
  zh: '分享',
  en: 'Share',
  vi: 'Chia sẻ',
}

export const ShareActions: FC<ShareActionsProps> = ({ imageBlob, title }) => {
  const { uiLanguage } = useLanguage()

  const canShare = useMemo(() => {
    if (typeof navigator === 'undefined' || !navigator.canShare) return false
    const file = new File([imageBlob], 'share.png', { type: 'image/png' })
    return navigator.canShare({ files: [file] })
  }, [imageBlob])

  const handleSave = useCallback(() => {
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zhiyu-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, [imageBlob])

  const handleShare = useCallback(async () => {
    const file = new File([imageBlob], 'zhiyu-share.png', { type: 'image/png' })
    try {
      await navigator.share({ files: [file], title })
    } catch {
      // User cancelled or share failed — silent
    }
  }, [imageBlob, title])

  return (
    <div className="flex gap-3 mt-4">
      <button
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
          glass-card text-[var(--color-text-primary)] font-medium text-sm"
        onClick={handleSave}
      >
        <Download size={18} />
        {SAVE_LABELS[uiLanguage]}
      </button>

      {canShare && (
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
            bg-[var(--color-rose)] text-white font-medium text-sm"
          onClick={handleShare}
        >
          <Share size={18} />
          {SHARE_LABELS[uiLanguage]}
        </button>
      )}
    </div>
  )
}

ShareActions.displayName = 'ShareActions'
