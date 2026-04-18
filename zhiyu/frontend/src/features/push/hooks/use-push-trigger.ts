import { useState, useCallback } from 'react'
import type { PushTriggerEvent } from '../types'

const STORAGE_KEY = 'push_guide_shown'

export function usePushTrigger() {
  const [shouldShowGuide, setShouldShowGuide] = useState(false)

  const checkTrigger = useCallback((event: PushTriggerEvent) => {
    // 已经展示过引导弹窗，不再触发
    if (localStorage.getItem(STORAGE_KEY) === 'true') return
    // 浏览器不支持
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    // 已经授权
    if (Notification.permission === 'granted') return

    // 满足触发条件
    if (['course_complete', 'article_collect', 'game_complete'].includes(event)) {
      setShouldShowGuide(true)
    }
  }, [])

  const dismissGuide = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShouldShowGuide(false)
  }, [])

  const onGuideComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShouldShowGuide(false)
  }, [])

  return { shouldShowGuide, checkTrigger, dismissGuide, onGuideComplete }
}
