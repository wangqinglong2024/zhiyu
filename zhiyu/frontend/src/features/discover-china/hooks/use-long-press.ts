import { useRef, useCallback, useEffect, useState } from 'react'

interface LongPressResult {
  text: string
  x: number
  y: number
}

export function useLongPress(threshold = 400) {
  const [result, setResult] = useState<LongPressResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const posRef = useRef({ x: 0, y: 0 })

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    const touch = e.touches[0]!
    posRef.current = { x: touch.clientX, y: touch.clientY }

    timerRef.current = setTimeout(() => {
      // Attempt haptic feedback
      if (navigator.vibrate) navigator.vibrate(10)

      // Get selected text from range
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      if (text) {
        setResult({
          text,
          x: posRef.current.x,
          y: posRef.current.y,
        })
      }
    }, threshold)
  }, [threshold])

  const onTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchMove = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const dismiss = useCallback(() => setResult(null), [])

  // Dismiss on outside click
  useEffect(() => {
    if (!result) return
    const handler = () => setResult(null)
    document.addEventListener('touchstart', handler, { once: true })
    return () => document.removeEventListener('touchstart', handler)
  }, [result])

  return {
    result,
    dismiss,
    handlers: { onTouchStart, onTouchEnd, onTouchMove },
  }
}
