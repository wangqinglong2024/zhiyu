import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from './config'

// 全局单例 — 应用启动时初始化一次，模块导出共享
// 使用 SERVICE_ROLE_KEY：绕过 RLS，用于服务端管理操作
const supabaseAdmin: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// 使用 ANON_KEY：遵循 RLS，用于代理用户请求
const supabaseClient: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * 健康检查 — 验证 Supabase 连接是否可用
 * 使用 rpc 调用或简单查询判断连接状态
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    // 尝试查询 system_configs（如果迁移已执行，该表应存在）
    const { error } = await supabaseAdmin
      .from('system_configs')
      .select('key')
      .limit(1)
      .maybeSingle()

    // 如果表不存在（迁移未执行），仍认为连接成功
    if (error) {
      const msg = error.message || ''
      if (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation')) {
        // 连接正常，只是表未创建
        return true
      }
      console.error('❌ Supabase 健康检查失败：', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('❌ Supabase 连接异常：', err)
    return false
  }
}

export { supabaseAdmin, supabaseClient }
