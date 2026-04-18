import { useState, useEffect, useCallback } from 'react'

export function useSwUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      setRegistration(reg)

      // 检测新版本
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setHasUpdate(true)
          }
        })
      })
    }).catch(err => {
      console.warn('SW registration failed:', err)
    })

    // 定期检查更新（每小时）
    const interval = setInterval(() => {
      registration?.update()
    }, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [registration])

  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) return
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }, [registration])

  return { hasUpdate, applyUpdate }
}
