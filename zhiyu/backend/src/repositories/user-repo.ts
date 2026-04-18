import { supabaseAdmin } from '../core/supabase'
import type { ProfileResponse } from '../models/user'

/**
 * 用户数据访问层 — profiles 表 CRUD
 */
export class UserRepo {
  /**
   * 通过 ID 获取用户 profile
   */
  async findById(userId: string): Promise<ProfileResponse | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw new Error(`查询用户失败: ${error.message}`)
    return data as ProfileResponse | null
  }

  /**
   * 通过推荐码查找用户
   */
  async findByReferralCode(code: string): Promise<ProfileResponse | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('referral_code', code)
      .maybeSingle()

    if (error) throw new Error(`查询推荐码失败: ${error.message}`)
    return data as ProfileResponse | null
  }

  /**
   * 更新用户 referred_by 字段
   */
  async updateReferredBy(userId: string, referrerId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('id', userId)

    if (error) throw new Error(`更新推荐人失败: ${error.message}`)
  }

  /**
   * 更新用户 display_name
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)

    if (error) throw new Error(`更新昵称失败: ${error.message}`)
  }

  /**
   * 更新用户 profile 部分字段
   */
  async updateProfile(userId: string, updates: Record<string, unknown>): Promise<ProfileResponse | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .maybeSingle()

    if (error) throw new Error(`更新用户失败: ${error.message}`)
    return data as ProfileResponse | null
  }
}

export const userRepo = new UserRepo()
