import { z } from 'zod'

// ===== Zod Schema =====
export const ProfileUpdateSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  display_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  ui_language: z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms']).optional(),
  learning_mode: z.enum(['pinyin_chinese', 'chinese_only']).optional(),
  explanation_enabled: z.boolean().optional(),
  explanation_language: z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms']).optional(),
})

// ===== TypeScript 类型 =====
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>

export interface ProfileResponse {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'content_ops' | 'user_ops' | 'game_ops'
  status: 'active' | 'suspended' | 'banned'
  ui_language: string
  learning_mode: string
  current_level: number
  zhiyu_coins: number
  game_rank: string
  game_stars: number
  referral_code: string
  is_paid: boolean
  created_at: string
  updated_at: string
}
