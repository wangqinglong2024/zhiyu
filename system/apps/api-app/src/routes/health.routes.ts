import { Hono } from 'hono';
import type { Env } from '../env.ts';

export function healthRoutes(env: Env) {
  const r = new Hono();
  const startedAt = Date.now();
  r.get('/', (c) =>
    c.json({
      code: 0,
      data: {
        uptime_s: Math.floor((Date.now() - startedAt) / 1000),
        env: env.APP_ENV,
        adapters: { llm: 'mock', payment: 'mock', email: 'mock', google_oauth: 'mock' },
      },
    }),
  );
  return r;
}
