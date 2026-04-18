import { type FC, useState, useCallback } from 'react'

interface ImageViewerProps {
  src: string
  alt?: string
}

export const ImageViewer: FC<ImageViewerProps> = ({ src, alt }) => {
  const [fullscreen, setFullscreen] = useState(false)

  const handleOpen = useCallback(() => setFullscreen(true), [])
  const handleClose = useCallback(() => setFullscreen(false), [])

  return (
    <>
      {/* Inline image */}
      <div className="my-4 rounded-2xl overflow-hidden cursor-pointer" onClick={handleOpen}>
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={handleClose}
        >
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full max-h-full object-contain touch-pinch-zoom"
          />
        </div>
      )}
    </>
  )
}

ImageViewer.displayName = 'ImageViewer'
