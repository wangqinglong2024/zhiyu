import { z } from 'zod';

export const EmailSchema = z.string().trim().toLowerCase().email();
export const PasswordSchema = z
  .string()
  .min(8, 'auth.password.too_short')
  .max(72, 'auth.password.too_long')
  .regex(/[A-Za-z]/, 'auth.password.need_letter')
  .regex(/\d/, 'auth.password.need_digit');

export const RegisterReq = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  display_name: z.string().min(1).max(40).optional(),
  locale: z.enum(['zh', 'en', 'vi', 'th', 'id']).optional(),
});
export type RegisterReq = z.infer<typeof RegisterReq>;

export const LoginReq = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(72),
  device_id: z.string().min(8).max(64).optional(),
  device_name: z.string().min(1).max(64).optional(),
});
export type LoginReq = z.infer<typeof LoginReq>;

export const ForgotPasswordReq = z.object({ email: EmailSchema });
export const ResetPasswordReq = z.object({
  token: z.string().min(8),
  new_password: PasswordSchema,
});

export const SessionInfo = z.object({
  id: z.string().uuid(),
  device_id: z.string(),
  device_name: z.string().nullable(),
  user_agent: z.string().nullable(),
  ip: z.string().nullable(),
  last_seen_at: z.string(),
  created_at: z.string(),
});
export type SessionInfo = z.infer<typeof SessionInfo>;

export const AuthUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['super_admin', 'user']),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  locale: z.enum(['zh', 'en', 'vi', 'th', 'id']),
  is_active: z.boolean(),
  email_verified_at: z.string().nullable(),
});
export type AuthUser = z.infer<typeof AuthUser>;
