import webpush from 'web-push'
import { pushRepo } from '../repositories/push-repo'
import type { SubscribeInput, NotificationPreferences, SendPushInput } from '../models/push'

// VAPID 密钥对（生产环境应从环境变量读取）
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPlaceholderKeyForDevelopment-ThisWillBeReplacedInProduction1234567890'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'placeholder-private-key-for-dev'

try {
  webpush.setVapidDetails(
    'mailto:support@zhiyu.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  )
} catch {
  console.warn('⚠️ VAPID 密钥未配置，推送功能不可用')
}

export class PushService {
  getVapidPublicKey() {
    return VAPID_PUBLIC_KEY
  }

  async subscribe(userId: string, input: SubscribeInput) {
    return pushRepo.createSubscription(userId, input)
  }

  async unsubscribe(userId: string) {
    return pushRepo.deleteSubscription(userId)
  }

  async getPreferences(userId: string) {
    const prefs = await pushRepo.getPreferences(userId)
    return prefs || {
      learning_reminder: true,
      course_update: true,
      activity_notice: true,
      social_interaction: true,
      system_announcement: true,
    }
  }

  async updatePreferences(userId: string, prefs: NotificationPreferences) {
    return pushRepo.upsertPreferences(userId, prefs as Record<string, boolean>)
  }

  async sendNotification(input: SendPushInput) {
    const subscriptions = await pushRepo.getSubscriptionsByUserIds(input.user_ids)

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      type: input.type,
      url: input.target_url || '/',
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          payload,
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { sent, failed, total: subscriptions.length }
  }
}

export const pushService = new PushService()
