import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { LoginReq, RegisterReq } from '@zhiyu/shared-schemas';
import { COOKIE, JWT_TTL, MAX_ACTIVE_SESSIONS } from '@zhiyu/shared-config';
import { randomToken, randomDeviceId } from '@zhiyu/shared-utils';
import { sb } from '../lib/supabase.ts';
import { AppError } from '../middlewares/error.ts';
import type { Env } from '../env.ts';

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

    // 写 httpOnly Cookie + CSRF Double-Submit
    const csrf = randomToken(24);
    setCookie(c, COOKIE.ACCESS_TOKEN, data.session.access_token, {
      httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: JWT_TTL.ACCESS_SEC,
    });
    setCookie(c, COOKIE.REFRESH_TOKEN, data.session.refresh_token, {
      httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: JWT_TTL.REFRESH_SEC,
    });
    setCookie(c, COOKIE.CSRF, csrf, {
      httpOnly: false, sameSite: 'Lax', secure: false, path: '/', maxAge: JWT_TTL.ACCESS_SEC,
    });

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

  // ---- 当前会话校验（用于前端 boot）----
  r.get('/session', async (c) => {
    const at = getCookie(c, COOKIE.ACCESS_TOKEN);
    if (!at) return c.json({ code: 0, data: { authenticated: false } });
    const { data, error } = await sb(env).auth.getUser(at);
    if (error || !data.user) return c.json({ code: 0, data: { authenticated: false } });
    const { data: profile } = await sb(env).from('profiles').select('*').eq('id', data.user.id).single();
    return c.json({
      code: 0,
      data: {
        authenticated: true,
        user: profile,
      },
    });
  });

  return r;
}
