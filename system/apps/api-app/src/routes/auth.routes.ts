import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import {
  LoginReq,
  RegisterReq,
  SendEmailOtpReq,
  VerifyRegisterOtpReq,
  ResetPasswordOtpReq,
  GoogleLoginReq,
} from '@zhiyu/shared-schemas';
import { COOKIE, SESSION_ROLLING_SEC, MAX_ACTIVE_SESSIONS } from '@zhiyu/shared-config';
import { randomToken, randomDeviceId } from '@zhiyu/shared-utils';
import { sb } from '../lib/supabase.ts';
import { AppError } from '../middlewares/error.ts';
import { sendEmailOtp, consumeEmailOtp } from '../lib/email-otp.ts';
import type { Context } from 'hono';
import type { Env } from '../env.ts';

/** 写 access/refresh/csrf cookie，maxAge 统一 30 天（滚动）。 */
function writeAuthCookies(c: Context, accessToken: string, refreshToken: string, csrf: string) {
  setCookie(c, COOKIE.ACCESS_TOKEN, accessToken, {
    httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: SESSION_ROLLING_SEC,
  });
  setCookie(c, COOKIE.REFRESH_TOKEN, refreshToken, {
    httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: SESSION_ROLLING_SEC,
  });
  setCookie(c, COOKIE.CSRF, csrf, {
    httpOnly: false, sameSite: 'Lax', secure: false, path: '/', maxAge: SESSION_ROLLING_SEC,
  });
}

export function authRoutes(env: Env) {
  const r = new Hono();

  // ---- 注册 ----
  r.post('/register', zValidator('json', RegisterReq), async (c) => {
    const body = c.req.valid('json');
    const { data, error } = await sb(env).auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // dev: 自动确认（mock 邮件）
      user_metadata: {
        role: 'user',
        display_name: body.display_name ?? body.email.split('@')[0],
        locale: body.locale ?? 'zh',
      },
    });
    if (error || !data.user) {
      throw new AppError(41008, error?.message ?? 'register failed', 400);
    }
    return c.json({ code: 0, data: { user_id: data.user.id, email: data.user.email } });
  });

  // ---- 登录 ----
  r.post('/login', zValidator('json', LoginReq), async (c) => {
    const body = c.req.valid('json');
    const ip = c.req.header('x-forwarded-for') ?? '';
    const ua = c.req.header('user-agent') ?? '';

    // 调 Supabase 密码登录
    const { data, error } = await sb(env).auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    // 记录尝试
    await sb(env)
      .from('auth_login_attempts')
      .insert({ email: body.email, ip, user_agent: ua, success: !error, reason: error?.message ?? null })
      .select()
      .single()
      .then(() => undefined, () => undefined);

    if (error || !data.session || !data.user) {
      throw new AppError(41002, 'auth.invalid_credentials', 401);
    }

    // profile 状态校验
    const { data: profile } = await sb(env).from('profiles').select('*').eq('id', data.user.id).single();
    if (!profile || profile.is_active === false) {
      throw new AppError(41003, 'auth.account_disabled', 403);
    }

    // 设备会话登记 + 上限检查
    const deviceId = body.device_id ?? randomDeviceId();
    const { data: sessions } = await sb(env)
      .from('user_sessions')
      .select('id, device_id, last_seen_at')
      .eq('user_id', data.user.id)
      .order('last_seen_at', { ascending: false });
    const exists = sessions?.find((s) => s.device_id === deviceId);
    if (!exists) {
      const active = sessions?.length ?? 0;
      if (active >= MAX_ACTIVE_SESSIONS) {
        throw new AppError(41005, 'auth.session_limit', 409, { active, max: MAX_ACTIVE_SESSIONS });
      }
      await sb(env).from('user_sessions').insert({
        user_id: data.user.id,
        device_id: deviceId,
        device_name: body.device_name ?? null,
        user_agent: ua,
        ip,
      });
    } else {
      await sb(env)
        .from('user_sessions')
        .update({ last_seen_at: new Date().toISOString(), user_agent: ua, ip })
        .eq('id', exists.id);
    }

    // 写 httpOnly Cookie + CSRF Double-Submit（滚动 30 天）
    const csrf = randomToken(24);
    writeAuthCookies(c, data.session.access_token, data.session.refresh_token, csrf);

    return c.json({
      code: 0,
      data: {
        user: { id: profile.id, email: profile.email, role: profile.role, display_name: profile.display_name },
        device_id: deviceId,
        csrf,
      },
    });
  });

  // ---- 登出（当前设备）----
  r.post('/logout', async (c) => {
    deleteCookie(c, COOKIE.ACCESS_TOKEN, { path: '/' });
    deleteCookie(c, COOKIE.REFRESH_TOKEN, { path: '/' });
    deleteCookie(c, COOKIE.CSRF, { path: '/' });
    return c.json({ code: 0, data: { logged_out: true } });
  });

  // ---- 当前会话校验（用于前端 boot，同时是 Cookie 滚动续期点）----
  r.get('/session', async (c) => {
    const at = getCookie(c, COOKIE.ACCESS_TOKEN);
    const rt = getCookie(c, COOKIE.REFRESH_TOKEN);
    const existingCsrf = getCookie(c, COOKIE.CSRF);

    let userId: string | null = null;
    let accessToken = at;
    let refreshToken = rt;

    if (at) {
      const { data, error } = await sb(env).auth.getUser(at);
      if (!error && data.user) userId = data.user.id;
    }
    // access 失效但 refresh 还在 → 静默换一对新 token
    if (!userId && rt) {
      const { data, error } = await sb(env).auth.refreshSession({ refresh_token: rt });
      if (!error && data.session && data.user) {
        userId = data.user.id;
        accessToken = data.session.access_token;
        refreshToken = data.session.refresh_token;
      }
    }
    if (!userId || !accessToken || !refreshToken) {
      return c.json({ code: 0, data: { authenticated: false } });
    }

    const { data: profile } = await sb(env).from('profiles').select('*').eq('id', userId).single();

    // 滚动续期：重写 cookie，maxAge 重新计 30 天
    const csrf = existingCsrf ?? randomToken(24);
    writeAuthCookies(c, accessToken, refreshToken, csrf);

    return c.json({
      code: 0,
      data: {
        authenticated: true,
        user: profile,
      },
    });
  });

  // ---- 发送邮箱验证码（register / reset_password）----
  r.post('/email/send-otp', zValidator('json', SendEmailOtpReq), async (c) => {
    const body = c.req.valid('json');
    if (body.purpose === 'reset_password') {
      // 找回密码：仅对已存在账号发送验证码；为避免账号枚举，响应统一 200
      const { data: prof } = await sb(env)
        .from('profiles').select('id').eq('email', body.email).maybeSingle();
      if (!prof) {
        return c.json({ code: 0, data: { sent: true, dev_skipped: true } });
      }
    }
    if (body.purpose === 'register') {
      const { data: prof } = await sb(env)
        .from('profiles').select('id').eq('email', body.email).maybeSingle();
      if (prof) throw new AppError(41009, 'auth.email_already_registered', 409);
    }
    const code = await sendEmailOtp(body.email, body.purpose, env);
    return c.json({
      code: 0,
      data: {
        sent: true,
        // dev 环境直接回显验证码，方便联调；生产由前端忽略
        dev_code: env.APP_ENV === 'production' ? undefined : code,
      },
    });
  });

  // ---- 完成注册（验证码 + 创建用户）----
  r.post('/register/verify', zValidator('json', VerifyRegisterOtpReq), async (c) => {
    const body = c.req.valid('json');
    const ok = await consumeEmailOtp(body.email, body.code, 'register');
    if (!ok) throw new AppError(41010, 'auth.otp.invalid_or_expired', 400);

    const { data, error } = await sb(env).auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        role: 'user',
        display_name: body.display_name ?? body.email.split('@')[0],
        locale: body.locale ?? 'zh',
      },
    });
    if (error || !data.user) throw new AppError(41008, error?.message ?? 'register failed', 400);
    return c.json({ code: 0, data: { user_id: data.user.id, email: data.user.email } });
  });

  // ---- 重置密码（验证码 + 新密码）----
  r.post('/password/reset', zValidator('json', ResetPasswordOtpReq), async (c) => {
    const body = c.req.valid('json');
    const ok = await consumeEmailOtp(body.email, body.code, 'reset_password');
    if (!ok) throw new AppError(41010, 'auth.otp.invalid_or_expired', 400);
    const { data: prof } = await sb(env)
      .from('profiles').select('id').eq('email', body.email).maybeSingle();
    if (!prof) throw new AppError(40400, 'auth.user_not_found', 404);
    const { error } = await sb(env).auth.admin.updateUserById(
      (prof as { id: string }).id,
      { password: body.new_password },
    );
    if (error) throw new AppError(41011, error.message, 400);
    return c.json({ code: 0, data: { reset: true } });
  });

  // ---- Google 登录（mock：dev 直接以 mock_email 创建/登录）----
  r.post('/google', zValidator('json', GoogleLoginReq), async (c) => {
    const body = c.req.valid('json');
    const email = body.mock_email ?? 'google.demo@zhiyu.local';
    const display = body.mock_name ?? 'Google Demo';
    const ip = c.req.header('x-forwarded-for') ?? '';
    const ua = c.req.header('user-agent') ?? '';

    let userId: string;
    let userPassword: string | null = null;
    const { data: prof } = await sb(env).from('profiles').select('id').eq('email', email).maybeSingle();
    if (prof) {
      userId = (prof as { id: string }).id;
      // 重置一次密码，便于使用 password 流签发 session
      userPassword = randomToken(24);
      await sb(env).auth.admin.updateUserById(userId, { password: userPassword });
    } else {
      userPassword = randomToken(24);
      const { data, error } = await sb(env).auth.admin.createUser({
        email,
        password: userPassword,
        email_confirm: true,
        user_metadata: { role: 'user', display_name: display, locale: 'zh', provider: 'google' },
      });
      if (error || !data.user) throw new AppError(41008, error?.message ?? 'google login failed', 400);
      userId = data.user.id;
    }
    const { data: signin, error: signinErr } = await sb(env).auth.signInWithPassword({
      email,
      password: userPassword!,
    });
    if (signinErr || !signin.session) throw new AppError(41008, signinErr?.message ?? 'google login failed', 400);

    const { data: profileFinal } = await sb(env).from('profiles').select('*').eq('id', userId).single();
    const csrf = randomToken(24);
    writeAuthCookies(c, signin.session.access_token, signin.session.refresh_token, csrf);
    // 写一条 session
    await sb(env).from('user_sessions').insert({
      user_id: userId,
      device_id: randomDeviceId(),
      device_name: 'google-mock',
      user_agent: ua,
      ip,
    });
    return c.json({ code: 0, data: { user: profileFinal, csrf, provider: 'google_mock' } });
  });

  return r;
}
