import { createClient } from '@supabase/supabase-js'
import { APP_CONFIG } from './constants'

// 前端使用 ANON_KEY — 所有操作受 RLS 策略约束
export const supabase = createClient(
  APP_CONFIG.supabaseUrl,
  APP_CONFIG.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
