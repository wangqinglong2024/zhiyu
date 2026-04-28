// I2 · 健康检查（公开）
import { Hono } from 'hono';
import type { Env } from '../../env.ts';
import { ok } from '../../middlewares/respond.ts';
import { getTtsProvider } from '../../services/china/tts-mock.adapter.ts';

const startedAt = Date.now();

export function healthRoutes(env: Env) {
  const r = new Hono();
  r.get('/', (c) =>
    ok(c, {
      service: 'china',
      uptime_s: Math.round((Date.now() - startedAt) / 1000),
      tts_adapter: getTtsProvider(env),
    }),
  );
  return r;
}
