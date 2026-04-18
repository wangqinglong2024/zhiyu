import { useState, useCallback } from 'react'

export function useShare() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (generator: () => Promise<Blob>) => {
    if (isGenerating) return
    setIsGenerating(true)
    setError(null)
    try {
      const blob = await generator()
      setImageBlob(blob)
      setIsOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片生成失败')
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  const close = useCallback(() => {
    setIsOpen(false)
    setImageBlob(null)
  }, [])

  return { isGenerating, imageBlob, isOpen, error, generate, close }
}
