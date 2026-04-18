import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware, type AuthRequest } from '../../core/auth'
import { success } from '../../core/response'
import { authService } from '../../services/auth-service'
import {
  RegisterSchema,
  LoginSchema,
  OAuthCallbackSchema,
  ForgotPasswordSchema,
  VerifyCodeSchema,
  ResetPasswordSchema,
  RefreshTokenSchema,
  ValidateReferralSchema,
} from '../../models/auth'

const router = Router()

// POST /api/v1/auth/register — 邮箱注册
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = RegisterSchema.parse(req.body)
    const result = await authService.register(input)
    success(res, result, '注册成功')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/login — 邮箱登录
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = LoginSchema.parse(req.body)
    const result = await authService.login(input)
    success(res, result, '登录成功')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/oauth/callback — OAuth 回调
router.post('/oauth/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = OAuthCallbackSchema.parse(req.body)
    const result = await authService.oauthCallback(input.access_token, input.refresh_token)
    success(res, result, 'OAuth 登录成功')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/forgot-password — 发送重置密码验证码
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = ForgotPasswordSchema.parse(req.body)
    const result = await authService.forgotPassword(input)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/verify-code — 验证重置密码验证码
router.post('/verify-code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    VerifyCodeSchema.parse(req.body)
    // 由 Supabase 处理验证，前端直接调 reset-password
    success(res, { valid: true }, '验证码有效')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/reset-password — 设置新密码
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = ResetPasswordSchema.parse(req.body)
    const result = await authService.resetPassword(input)
    success(res, result, '密码已重置')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/refresh-token — 刷新 Token
router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = RefreshTokenSchema.parse(req.body)
    const result = await authService.refreshToken(input.refresh_token)
    success(res, result, 'Token 已刷新')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/logout — 登出
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const result = await authService.logout(authReq.user.sub)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/auth/me — 获取当前用户
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const profile = await authService.getMe(authReq.user.sub)
    success(res, profile)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/validate-referral — 验证推荐码
router.post('/validate-referral', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = ValidateReferralSchema.parse(req.body)
    const result = await authService.validateReferral(input.referral_code)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

export default router
