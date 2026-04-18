import { z } from 'zod'
import dotenv from 'dotenv'

// 在应用启动时加载 .env
dotenv.config()

// 使用 Zod 校验环境变量，启动时即发现配置缺失
const envSchema = z.object({
  // 应用
  APP_ENV: z.enum(['dev', 'staging', 'production']).default('dev'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_INTERNAL_PORT: z.coerce.number().default(3000),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),

  // Dify（可选，后续功能需要时再强制）
  DIFY_API_URL: z.string().url().optional(),
  DIFY_API_KEY: z.string().optional(),

  // Redis（可选）
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
})

// 解析并验证，启动时失败快速报错
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ 环境变量校验失败：')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
export type AppConfig = z.infer<typeof envSchema>
