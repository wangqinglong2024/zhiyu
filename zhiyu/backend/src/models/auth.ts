import { z } from 'zod'

// ===== 注册请求 =====
export const RegisterSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(254).describe('注册邮箱'),
  password: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .describe('密码'),
  nickname: z.string().min(2, '昵称至少 2 个字符').max(20, '昵称最多 20 个字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, '昵称仅支持中英文、数字和下划线')
    .describe('昵称'),
  referral_code: z.string().length(8).optional().describe('推荐码（选填）'),
})

// ===== 登录请求 =====
export const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').describe('登录邮箱'),
  password: z.string().min(8, '密码至少 8 位').describe('密码'),
})

// ===== OAuth 回调 =====
export const OAuthCallbackSchema = z.object({
  access_token: z.string().min(1).describe('OAuth access token'),
  refresh_token: z.string().min(1).describe('OAuth refresh token'),
})

// ===== 忘记密码 =====
export const ForgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').describe('注册邮箱'),
})

// ===== 验证码验证 =====
export const VerifyCodeSchema = z.object({
  email: z.string().email().describe('注册邮箱'),
  code: z.string().length(6, '验证码为 6 位').describe('验证码'),
})

// ===== 重置密码 =====
export const ResetPasswordSchema = z.object({
  email: z.string().email().describe('注册邮箱'),
  code: z.string().length(6).describe('验证码'),
  new_password: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .describe('新密码'),
})

// ===== 刷新 Token =====
export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1).describe('Refresh Token'),
})

// ===== 验证推荐码 =====
export const ValidateReferralSchema = z.object({
  referral_code: z.string().length(8).describe('推荐码'),
})

// ===== TypeScript 类型 =====
export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type OAuthCallbackInput = z.infer<typeof OAuthCallbackSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>
export type ValidateReferralInput = z.infer<typeof ValidateReferralSchema>
