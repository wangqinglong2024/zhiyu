import { supabaseAdmin } from '../core/supabase'
import { AppException } from '../core/exceptions'
import { userRepo } from '../repositories/user-repo'
import type { RegisterInput, LoginInput, ResetPasswordInput, ForgotPasswordInput } from '../models/auth'
import type { ProfileResponse } from '../models/user'

// 登录失败计数器（内存实现，生产可改 Redis）
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_DURATION = 15 * 60 * 1000 // 15 分钟

// 验证码发送频率限制
const codeRateLimit = new Map<string, number>()
const CODE_COOLDOWN = 60 * 1000 // 60 秒

/**
 * 认证业务服务层
 */
export class AuthService {
  /**
   * 邮箱注册
   */
  async register(input: RegisterInput) {
    // 1. 调 Supabase Auth 创建用户
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { display_name: input.nickname },
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        throw new AppException(409, 40902, '该邮箱已注册')
      }
      throw new AppException(500, 50000, `注册失败: ${authError.message}`)
    }

    const userId = authData.user.id

    // 2. 更新 display_name（触发器已创建 profile）
    await userRepo.updateDisplayName(userId, input.nickname)

    // 3. 处理推荐码
    if (input.referral_code) {
      const referrer = await userRepo.findByReferralCode(input.referral_code)
      if (referrer) {
        await userRepo.updateReferredBy(userId, referrer.id)
      }
    }

    // 4. 生成 session tokens
    await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: input.email,
    })

    // 直接用 signInWithPassword 获取真实 token
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (signInError) {
      throw new AppException(500, 50000, `登录会话创建失败: ${signInError.message}`)
    }

    // 5. 获取完整 profile
    const profile = await userRepo.findById(userId)

    return {
      access_token: signInData.session!.access_token,
      refresh_token: signInData.session!.refresh_token,
      user: profile,
    }
  }

  /**
   * 邮箱登录
   */
  async login(input: LoginInput) {
    const key = input.email.toLowerCase()

    // 检查账号锁定
    const attempt = loginAttempts.get(key)
    if (attempt && attempt.lockedUntil > Date.now()) {
      throw new AppException(429, 42901, '登录尝试次数过多，请 15 分钟后重试')
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (error) {
      // 记录失败次数
      const current = loginAttempts.get(key) || { count: 0, lockedUntil: 0 }
      current.count += 1
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCK_DURATION
        current.count = 0
      }
      loginAttempts.set(key, current)

      if (error.message.includes('Invalid login credentials')) {
        throw new AppException(401, 40101, '密码错误，请重试')
      }
      throw new AppException(401, 40101, '登录失败')
    }

    // 登录成功，清除计数
    loginAttempts.delete(key)

    const profile = await userRepo.findById(data.user!.id)

    // 检查账号状态
    if (profile && profile.status === 'banned') {
      throw new AppException(403, 40302, '账号已被封禁')
    }

    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
      user: profile,
    }
  }

  /**
   * OAuth 回调后处理
   */
  async oauthCallback(accessToken: string, refreshToken: string) {
    const { data: userData, error } = await supabaseAdmin.auth.getUser(accessToken)
    if (error) {
      throw new AppException(401, 40101, 'OAuth token 无效')
    }

    const profile = await userRepo.findById(userData.user.id)
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: profile,
    }
  }

  /**
   * 发送重置密码验证码
   */
  async forgotPassword(input: ForgotPasswordInput) {
    const key = input.email.toLowerCase()

    // 频率限制
    const lastSent = codeRateLimit.get(key) || 0
    if (Date.now() - lastSent < CODE_COOLDOWN) {
      throw new AppException(429, 42901, '验证码发送过于频繁，请 60 秒后重试')
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(input.email)
    if (error) {
      // 即使邮箱不存在也返回成功（防止邮箱枚举攻击）
      console.warn(`密码重置请求: ${error.message}`)
    }

    codeRateLimit.set(key, Date.now())
    return { message: '如果该邮箱已注册，验证码已发送' }
  }

  /**
   * 重置密码
   */
  async resetPassword(input: ResetPasswordInput) {
    // Supabase 通过 OTP 验证后直接更新密码
    const { error } = await supabaseAdmin.auth.verifyOtp({
      email: input.email,
      token: input.code,
      type: 'recovery',
    })

    if (error) {
      throw new AppException(400, 40001, '验证码无效或已过期')
    }

    // 找到用户并更新密码
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.users.find(u => u.email === input.email)
    if (!user) {
      throw new AppException(404, 40400, '用户不存在')
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: input.new_password,
    })

    if (updateError) {
      throw new AppException(500, 50000, `密码重置失败: ${updateError.message}`)
    }

    return { message: '密码已重置' }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      throw new AppException(401, 40102, 'Refresh Token 无效或已过期')
    }

    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
    }
  }

  /**
   * 登出
   */
  async logout(userId: string) {
    // Supabase 管理员级别登出
    await supabaseAdmin.auth.admin.signOut(userId)
    return { message: '已登出' }
  }

  /**
   * 获取当前用户 Profile
   */
  async getMe(userId: string): Promise<ProfileResponse | null> {
    return userRepo.findById(userId)
  }

  /**
   * 验证推荐码
   */
  async validateReferral(code: string) {
    const referrer = await userRepo.findByReferralCode(code)
    if (!referrer) {
      throw new AppException(404, 40400, '推荐码不存在')
    }
    return {
      valid: true,
      referrer_name: referrer.display_name || referrer.username || '知语用户',
    }
  }
}

export const authService = new AuthService()
