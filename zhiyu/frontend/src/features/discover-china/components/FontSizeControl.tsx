import { type FC, useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../i18n/hooks/use-language'

interface FontSizeControlProps {
  value: number
  onChange: (size: number) => void
}

const SIZES = [
  { value: 16, label: '小' },
  { value: 18, label: '默认' },
  { value: 20, label: '大' },
]

const SIZE_LABELS: Record<string, string[]> = {
  zh: ['小', '默认', '大'],
  en: ['S', 'Default', 'L'],
  vi: ['Nhỏ', 'Mặc định', 'Lớn'],
}

export const FontSizeControl: FC<FontSizeControlProps> = ({ value, onChange }) => {
  const { uiLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const labels = SIZE_LABELS[uiLanguage] ?? SIZE_LABELS.zh!

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        className="w-11 h-11 flex items-center justify-center text-[var(--color-text-secondary)]
          hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-label="Font size"
      >
        <span className="text-sm font-bold">A</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 glass-elevated rounded-2xl p-1 min-w-[100px] z-50">
          {SIZES.map((s, i) => (
            <button
              key={s.value}
              className={`w-full px-3 py-2 rounded-xl text-sm text-left transition-colors
                ${s.value === value
                  ? 'text-[var(--color-rose)] font-medium'
                  : 'text-[var(--color-text-primary)] hover:bg-white/10'}`}
              onClick={() => { onChange(s.value); setOpen(false) }}
            >
              {labels[i]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

FontSizeControl.displayName = 'FontSizeControl'
