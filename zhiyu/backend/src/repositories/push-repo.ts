import { supabaseAdmin } from '../core/supabase'

export class PushRepo {
  async createSubscription(userId: string, input: {
    endpoint: string
    p256dh: string
    auth_key: string
    user_agent?: string
  }) {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        ...input,
      }, { onConflict: 'user_id,endpoint' })
      .select()
      .single()

    if (error) throw new Error(`创建订阅失败: ${error.message}`)
    return data
  }

  async deleteSubscription(userId: string) {
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) throw new Error(`删除订阅失败: ${error.message}`)
  }

  async getPreferences(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(`查询偏好失败: ${error.message}`)
    return data
  }

  async upsertPreferences(userId: string, prefs: Record<string, boolean>) {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw new Error(`更新偏好失败: ${error.message}`)
    return data
  }

  async getSubscriptionsByUserIds(userIds?: string[]) {
    let query = supabaseAdmin.from('push_subscriptions').select('*')
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }
    const { data, error } = await query
    if (error) throw new Error(`查询订阅失败: ${error.message}`)
    return data || []
  }
}

export const pushRepo = new PushRepo()
