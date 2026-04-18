import type { FC } from 'react'

interface LongPressPopoverProps {
  text: string
  pinyin?: string
  meaning?: string
  x: number
  y: number
  onClose: () => void
}

export const LongPressPopover: FC<LongPressPopoverProps> = ({
  text, pinyin, meaning, x, y, onClose,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Popover */}
      <div
        className="fixed z-50 glass-elevated rounded-2xl p-4 min-w-[160px] max-w-[260px]
          shadow-xl animate-fade-in"
        style={{
          left: `${Math.min(x, window.innerWidth - 180)}px`,
          top: `${Math.max(40, y - 80)}px`,
        }}
      >
        <p className="text-xl font-bold text-[var(--color-text-primary)] text-center">{text}</p>
        {pinyin && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center mt-1">{pinyin}</p>
        )}
        {meaning && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">{meaning}</p>
        )}
      </div>
    </>
  )
}

LongPressPopover.displayName = 'LongPressPopover'
