import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(254),
  password: z.string().min(8, '密码至少 8 位'),
})

export const RegisterSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(254),
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  nickname: z
    .string()
    .min(2, '昵称至少 2 个字符')
    .max(20, '昵称最多 20 个字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, '昵称仅支持中英文、数字和下划线'),
  referral_code: z
    .string()
    .regex(/^[a-zA-Z0-9]{8}$/, '推荐码为 8 位字母数字')
    .optional()
    .or(z.literal('')),
  agree_terms: z.literal(true, { message: '请阅读并同意隐私政策和服务条款' }),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(254),
})

export const ResetPasswordSchema = z.object({
  code: z.string().min(6, '请输入验证码').max(6),
  new_password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字'),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
