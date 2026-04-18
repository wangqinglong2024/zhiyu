import { useState, useEffect, useCallback } from 'react'
import type { PushPermissionState } from '../types'
import { pushService } from '../services/push-service'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushPermission() {
  const [permissionState, setPermissionState] = useState<PushPermissionState>('prompt')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermissionState('unsupported')
      return
    }
    setPermissionState(Notification.permission as PushPermissionState)
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (permissionState === 'unsupported') return false

    const result = await Notification.requestPermission()
    setPermissionState(result as PushPermissionState)

    if (result !== 'granted') return false

    try {
      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = await pushService.getVapidPublicKey()

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      const json = subscription.toJSON()
      await pushService.subscribe({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth_key: json.keys!.auth!,
      })

      setIsSubscribed(true)
      return true
    } catch {
      return false
    }
  }, [permissionState])

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) await subscription.unsubscribe()
      await pushService.unsubscribe()
      setIsSubscribed(false)
    } catch {
      // ignore
    }
  }, [])

  return { permissionState, isSubscribed, requestPermission, unsubscribe }
}
