import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const VISIT_COUNT_KEY = 'pwa_visit_count'
const DISMISS_KEY = 'pwa_install_dismissed'
const DISMISS_DAYS = 7

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [shouldShowBanner, setShouldShowBanner] = useState(false)

  useEffect(() => {
    // 记录访问次数
    const count = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0') + 1
    localStorage.setItem(VISIT_COUNT_KEY, String(count))

    // 检查是否被关闭过（7 天冷却）
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSince < DISMISS_DAYS) return
    }

    // 检查是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      setCanInstall(true)

      // 第 2 次访问 + 停留 3 分钟
      if (count >= 2) {
        const timer = setTimeout(() => {
          setShouldShowBanner(true)
        }, 3 * 60 * 1000) // 3 分钟
        return () => clearTimeout(timer)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
    setShouldShowBanner(false)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShouldShowBanner(false)
  }, [])

  return { canInstall, shouldShowBanner, install, dismiss }
}
