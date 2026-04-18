export type NotificationType =
  | 'learning_reminder'
  | 'course_update'
  | 'activity_notice'
  | 'social_interaction'
  | 'system_announcement'

export interface PushSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth_key: string
}

export interface NotificationPreferences {
  learning_reminder: boolean
  course_update: boolean
  activity_notice: boolean
  social_interaction: boolean
  system_announcement: boolean
}

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export type PushTriggerEvent = 'course_complete' | 'article_collect' | 'game_complete'
