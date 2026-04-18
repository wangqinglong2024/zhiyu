import { type FC, useState, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopProps {
  threshold?: number
  className?: string
}

export const ScrollToTop: FC<ScrollToTopProps> = ({ threshold = 200, className = '' }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > threshold)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!visible) return null

  return (
    <button
      className={`fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full glass-elevated flex items-center justify-center shadow-lg animate-fade-in active:scale-90 transition-transform ${className}`}
      onClick={scrollToTop}
      aria-label="回到顶部"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ArrowUp size={18} className="text-[var(--text-primary)]" />
    </button>
  )
}

ScrollToTop.displayName = 'ScrollToTop'
