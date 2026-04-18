import { z } from 'zod'

// ===== 系统配置 =====
export const SystemConfigSchema = z.object({
  config_key: z.string().min(1).max(100),
  config_value: z.record(z.unknown()),
  category: z.string().max(50).default('general'),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
})

export type SystemConfig = z.infer<typeof SystemConfigSchema>

export interface SystemConfigResponse {
  id: string
  config_key: string
  config_value: Record<string, unknown>
  category: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// ===== 多语言翻译 =====
export const I18nTranslationSchema = z.object({
  translation_key: z.string().min(1).max(200),
  language: z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms']),
  translation_value: z.string().min(1),
  namespace: z.string().max(50).default('common'),
})

export type I18nTranslation = z.infer<typeof I18nTranslationSchema>

// ===== 统一响应格式 =====
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ===== 分页 =====
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type Pagination = z.infer<typeof PaginationSchema>

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
