import { type FC, useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export const OfflineBanner: FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[90] flex items-center justify-center gap-2 py-2 px-4 bg-[var(--color-accent-amber)] text-white text-xs font-medium animate-slide-down"
      style={{ paddingTop: 'calc(4px + env(safe-area-inset-top, 0px))' }}
      role="alert"
    >
      <WifiOff size={14} />
      <span>当前无网络连接，显示缓存内容</span>
    </div>
  )
}

OfflineBanner.displayName = 'OfflineBanner'
