import type { FC } from 'react'
import type { ArticleDetail } from '../../types/discover-china.types'

interface ArticleShareCanvasProps {
  article: ArticleDetail
  onImageReady: (blob: Blob) => void
  onError: (error: Error) => void
}

/**
 * Wrapper component for Article share card Canvas generation.
 * The actual Canvas logic lives in canvas-share.ts utility.
 */
export const ArticleShareCanvas: FC<ArticleShareCanvasProps> = () => {
  return null
}

ArticleShareCanvas.displayName = 'ArticleShareCanvas'
