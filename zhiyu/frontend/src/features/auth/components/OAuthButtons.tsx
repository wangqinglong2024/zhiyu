import type { FC } from 'react'
import { Globe } from 'lucide-react'

interface OAuthButtonsProps {
  onGoogle: () => void
  onApple: () => void
  loading?: boolean
}

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod|Macintosh/i.test(ua) && 'ontouchend' in document
    || /Mac/i.test(navigator.platform || '')
}

export const OAuthButtons: FC<OAuthButtonsProps> = ({ onGoogle, onApple, loading }) => {
  const showApple = isApplePlatform()

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn-glass w-full"
        onClick={onGoogle}
        disabled={loading}
        aria-label="使用 Google 登录"
      >
        <Globe size={18} />
        <span>使用 Google 登录</span>
      </button>

      {showApple && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm bg-black text-white dark:bg-white dark:text-black transition-all duration-200 hover:-translate-y-px"
          onClick={onApple}
          disabled={loading}
          aria-label="使用 Apple 登录"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span>使用 Apple 登录</span>
        </button>
      )}
    </div>
  )
}

OAuthButtons.displayName = 'OAuthButtons'
