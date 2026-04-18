import { z } from 'zod'

// ===== 翻译条目 Schema =====
export const TranslationSchema = z.object({
  id: z.string().uuid().optional(),
  translation_key: z.string().min(1).max(200).describe('翻译键'),
  language: z.enum(['zh', 'en', 'vi']).describe('语言代码'),
  translation_value: z.string().min(1).describe('翻译值'),
  namespace: z.string().max(50).default('common').describe('命名空间'),
})

// ===== 创建翻译 =====
export const CreateTranslationSchema = z.object({
  translation_key: z.string().min(1).max(200).describe('翻译键'),
  language: z.enum(['zh', 'en', 'vi']).describe('语言代码'),
  translation_value: z.string().min(1).describe('翻译值'),
  namespace: z.string().max(50).default('common').describe('命名空间'),
})

// ===== 更新翻译 =====
export const UpdateTranslationSchema = z.object({
  translation_key: z.string().min(1).max(200).optional(),
  language: z.enum(['zh', 'en', 'vi']).optional(),
  translation_value: z.string().min(1).optional(),
  namespace: z.string().max(50).optional(),
})

// ===== 批量导入 =====
export const BatchImportSchema = z.object({
  translations: z.array(CreateTranslationSchema).min(1).max(500).describe('翻译条目列表'),
})

// ===== 管理查询参数 =====
export const I18nQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().optional(),
  namespace: z.string().optional(),
  language: z.enum(['zh', 'en', 'vi']).optional(),
})

// ===== TypeScript 类型 =====
export type Translation = z.infer<typeof TranslationSchema>
export type CreateTranslation = z.infer<typeof CreateTranslationSchema>
export type UpdateTranslation = z.infer<typeof UpdateTranslationSchema>
export type BatchImport = z.infer<typeof BatchImportSchema>
export type I18nQuery = z.infer<typeof I18nQuerySchema>
