import { type FC, useState, useCallback, useRef, useEffect } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'

interface SortToggleProps {
  value: 'latest' | 'popular'
  onChange: (sort: 'latest' | 'popular') => void
}

const SORT_LABELS: Record<string, Record<string, string>> = {
  zh: { latest: '最新', popular: '最热' },
  en: { latest: 'Latest', popular: 'Popular' },
  vi: { latest: 'Mới nhất', popular: 'Phổ biến' },
}

export const SortToggle: FC<SortToggleProps> = ({ value, onChange }) => {
  const { uiLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const labels = SORT_LABELS[uiLanguage] ?? SORT_LABELS.zh!

  const handleSelect = useCallback((sort: 'latest' | 'popular') => {
    onChange(sort)
    setOpen(false)
  }, [onChange])

  // Close on outside click
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
        className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]
          hover:text-[var(--color-text-primary)] transition-colors px-2 py-1"
        onClick={() => setOpen(v => !v)}
      >
        <ArrowUpDown size={16} />
        <span>{labels[value]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 glass-elevated rounded-2xl p-1 min-w-[120px] z-50">
          {(['latest', 'popular'] as const).map(sort => (
            <button
              key={sort}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors
                ${sort === value
                  ? 'text-[var(--color-rose)] font-medium'
                  : 'text-[var(--color-text-primary)] hover:bg-white/10'}`}
              onClick={() => handleSelect(sort)}
            >
              {sort === value && <Check size={14} />}
              <span className={sort !== value ? 'pl-[22px]' : ''}>{labels[sort]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

SortToggle.displayName = 'SortToggle'
