import { z } from 'zod'

// ===== 推送订阅 =====
export const SubscribeSchema = z.object({
  endpoint: z.string().url().describe('推送端点 URL'),
  p256dh: z.string().min(1).describe('P-256 DH 公钥'),
  auth_key: z.string().min(1).describe('认证密钥'),
  user_agent: z.string().optional().describe('浏览器 UA'),
})

// ===== 通知偏好 =====
export const NotificationPreferencesSchema = z.object({
  learning_reminder: z.boolean().optional().describe('学习提醒'),
  course_update: z.boolean().optional().describe('课程更新'),
  activity_notice: z.boolean().optional().describe('活动通知'),
  social_interaction: z.boolean().optional().describe('社交互动'),
  system_announcement: z.boolean().optional().describe('系统公告'),
})

// ===== 管理员发送推送 =====
export const SendPushSchema = z.object({
  title: z.string().min(1).max(100).describe('通知标题'),
  body: z.string().min(1).max(500).describe('通知内容'),
  type: z.enum(['learning_reminder', 'course_update', 'activity_notice', 'social_interaction', 'system_announcement']).describe('通知类型'),
  target_url: z.string().optional().describe('点击跳转 URL'),
  user_ids: z.array(z.string().uuid()).optional().describe('指定用户列表（空则全部）'),
})

// ===== TypeScript 类型 =====
export type SubscribeInput = z.infer<typeof SubscribeSchema>
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>
export type SendPushInput = z.infer<typeof SendPushSchema>
