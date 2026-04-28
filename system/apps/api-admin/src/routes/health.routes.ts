import { Hono } from 'hono';
import type { Env } from '../env.ts';
import { ok } from '../middlewares/respond.ts';

const startedAt = Date.now();

export function healthRoutes(_env: Env) {
  const r = new Hono();
  r.get('/', (c) =>
    ok(c, { uptime_s: Math.floor((Date.now() - startedAt) / 1000), service: 'zhiyu-api-admin' }),
  );
  return r;
}
