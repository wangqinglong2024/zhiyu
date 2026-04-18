import { z } from 'zod'

// ===== 用户角色与状态枚举 =====
export const UserRoleEnum = z.enum(['user', 'admin', 'content_ops', 'user_ops', 'game_ops'])
export const UserStatusEnum = z.enum(['active', 'suspended', 'banned'])
export const LanguageCodeEnum = z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms'])
export const LearningModeEnum = z.enum(['pinyin_chinese', 'chinese_only'])

// ===== Profiles 表 Zod Schema =====
export const ProfileSchema = z.object({
  id: z.string().uuid().describe('用户 UUID，关联 auth.users'),
  username: z.string().min(2).max(50).nullable().describe('用户名'),
  display_name: z.string().max(100).nullable().describe('显示名称'),
  avatar_url: z.string().url().nullable().describe('头像地址'),
  bio: z.string().max(500).nullable().describe('个人简介'),
  role: UserRoleEnum.default('user').describe('用户角色'),
  status: UserStatusEnum.default('active').describe('用户状态'),
  ui_language: LanguageCodeEnum.default('en').describe('UI 语言'),
  learning_mode: LearningModeEnum.default('pinyin_chinese').describe('学习模式'),
  explanation_enabled: z.boolean().default(true).describe('是否启用解释语言'),
  explanation_language: LanguageCodeEnum.default('vi').describe('解释语言'),
  current_level: z.number().int().min(1).max(12).default(1).describe('当前学习等级'),
  total_study_minutes: z.number().int().default(0).describe('累计学习时长'),
  zhiyu_coins: z.number().int().default(0).describe('知语币余额'),
  game_rank: z.string().default('bronze_3').describe('游戏段位'),
  game_stars: z.number().int().default(1).describe('段位星数'),
  referral_code: z.string().max(20).nullable().describe('推荐码'),
  referred_by: z.string().uuid().nullable().describe('推荐人 ID'),
  is_paid: z.boolean().default(false).describe('是否付费用户'),
  created_at: z.string().describe('创建时间'),
  updated_at: z.string().describe('更新时间'),
})

export const ProfileUpdateSchema = z.object({
  username: z.string().min(2).max(50).optional().describe('用户名'),
  display_name: z.string().max(100).optional().describe('显示名称'),
  avatar_url: z.string().url().optional().describe('头像地址'),
  bio: z.string().max(500).optional().describe('个人简介'),
  ui_language: LanguageCodeEnum.optional().describe('UI 语言'),
  learning_mode: LearningModeEnum.optional().describe('学习模式'),
  explanation_enabled: z.boolean().optional().describe('是否启用解释语言'),
  explanation_language: LanguageCodeEnum.optional().describe('解释语言'),
})

// ===== 推荐奖励 Zod Schema =====
export const ReferralRewardSchema = z.object({
  id: z.string().uuid(),
  referrer_id: z.string().uuid().describe('推荐人 ID'),
  referred_id: z.string().uuid().describe('被推荐人 ID'),
  reward_coins: z.number().int().describe('奖励知语币数'),
  source_order_id: z.string().uuid().nullable().describe('触发订单 ID'),
  status: z.enum(['pending', 'confirmed', 'revoked']).default('pending').describe('奖励状态'),
  confirmed_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  created_at: z.string(),
})

// ===== TypeScript 类型 =====
export type Profile = z.infer<typeof ProfileSchema>
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>
export type ReferralReward = z.infer<typeof ReferralRewardSchema>

export interface ProfileResponse {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'content_ops' | 'user_ops' | 'game_ops'
  status: 'active' | 'suspended' | 'banned'
  ui_language: string
  learning_mode: string
  explanation_enabled: boolean
  explanation_language: string
  current_level: number
  total_study_minutes: number
  zhiyu_coins: number
  game_rank: string
  game_stars: number
  referral_code: string | null
  referred_by: string | null
  is_paid: boolean
  created_at: string
  updated_at: string
}
