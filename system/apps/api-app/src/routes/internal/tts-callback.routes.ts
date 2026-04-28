// I1 · TTS Mock 内部回调（仅 service-role 可调用）
import { Hono } from 'hono';
import { InternalTtsCallbackReq } from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok } from '../../middlewares/respond.ts';
import { AppError } from '../../middlewares/error.ts';
import { applyTtsCallback } from '../../services/china/sentences.service.ts';

export function ttsCallbackRoutes(env: Env) {
  const r = new Hono();

  r.post('/callback', async (c) => {
    // 鉴权：要求请求头 Authorization: Bearer <SERVICE_ROLE_KEY> 或 x-service-role: <SERVICE_ROLE_KEY>
    const authHeader = c.req.header('authorization') || '';
    const xRole = c.req.header('x-service-role') || '';
    const expected = env.SUPABASE_SERVICE_ROLE_KEY;
    const got = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : xRole;
    if (!got || got !== expected) {
      throw new AppError(40100, 'service_role_required', 401);
    }
    const body = InternalTtsCallbackReq.parse(await c.req.json().catch(() => ({})));
    const out = await applyTtsCallback(sb(env), body);
    return ok(c, out);
  });

  return r;
}
