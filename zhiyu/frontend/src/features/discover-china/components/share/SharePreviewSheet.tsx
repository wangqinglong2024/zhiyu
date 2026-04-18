import { type FC, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { ShareActions } from './ShareActions'

interface SharePreviewSheetProps {
  imageBlob: Blob
  title: string
  onClose: () => void
}

export const SharePreviewSheet: FC<SharePreviewSheetProps> = ({ imageBlob, title, onClose }) => {
  const imageUrl = useMemo(() => URL.createObjectURL(imageBlob), [imageBlob])

  // Cleanup blob URL
  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[90] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="mt-auto relative z-10 glass-elevated rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]
        animate-slide-up max-h-[85vh] overflow-auto">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
            rounded-full bg-white/10 text-[var(--color-text-secondary)]"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Image preview */}
        <div className="flex justify-center mt-4 mb-4">
          <img
            src={imageUrl}
            alt="Share preview"
            className="max-h-[50vh] rounded-2xl shadow-xl object-contain"
          />
        </div>

        {/* Actions */}
        <ShareActions imageBlob={imageBlob} title={title} />
      </div>
    </div>
  )
}

SharePreviewSheet.displayName = 'SharePreviewSheet'
