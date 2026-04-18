// API 响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ===== 用户类型 =====
export type UserRole = 'user' | 'admin' | 'content_ops' | 'user_ops' | 'game_ops'
export type UserStatus = 'active' | 'suspended' | 'banned'
export type UILanguage = 'zh' | 'en' | 'vi'
export type LearningMode = 'pinyin_chinese' | 'chinese_only'
export type UserPermission = 'guest' | 'free' | 'paid'

export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  ui_language: UILanguage
  learning_mode: LearningMode
  explanation_enabled: boolean
  explanation_language: UILanguage
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

// ===== 认证类型 =====
export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: UserProfile
}

// ===== 推荐奖励 =====
export interface ReferralReward {
  id: string
  referrer_id: string
  referred_id: string
  reward_coins: number
  status: 'pending' | 'confirmed' | 'revoked'
  created_at: string
}

// ===== 翻译 =====
export interface TranslationBundle {
  [namespace: string]: Record<string, string>
}
