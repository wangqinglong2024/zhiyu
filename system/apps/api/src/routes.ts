import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { createServerClient } from '@zhiyu/sdk';
import { loadEnv } from '@zhiyu/config';
import { db } from './db.js';
import { errorEvents, meta } from '@zhiyu/db';
import { noopQueue } from './queue.js';
import { runReadiness } from './readiness.js';
import { registry } from './metrics.js';
import { isMetricsAllowed } from './metrics-acl.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerMeRoutes } from './routes/me.js';
import { registerSessionRoutes, registerGdprRoutes } from './routes/me-sessions.js';
import { registerTranslationRoutes } from './routes/translations.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { registerSearchRoutes } from './routes/search.js';
import { registerI18n } from './i18n-mw.js';

const env = loadEnv();
const startedAt = Date.now();

const PKG_VERSION = '0.1.0';
const VERSION = env.GIT_SHA ?? PKG_VERSION;

const telemetrySchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  fingerprint: z.string().max(200).optional(),
  context: z.record(z.unknown()).optional(),
  level: z.enum(['error', 'warn', 'info']).default('error'),
});

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    version: VERSION,
    service: env.SERVICE_NAME,
    uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
  }));

  // Permissive CORS for FE telemetry (Beacon + fetch). Restrict in real prod via gateway.
  app.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin;
    if (origin) {
      reply.header('access-control-allow-origin', origin);
      reply.header('access-control-allow-credentials', 'true');
      reply.header('access-control-allow-headers', 'content-type,x-request-id,authorization');
      reply.header('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      reply.header('vary', 'origin');
    }
    if (req.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  app.get('/ready', async (_req, reply) => {
    const r = await runReadiness();
    reply.code(r.ok ? 200 : 503);
    return r;
  });

  app.get('/metrics', async (req, reply) => {
    const allowed = isMetricsAllowed({ allowFlag: env.ALLOW_METRICS === true, remoteIp: req.ip });
    if (!allowed) {
      reply.code(403);
      return { error: 'metrics endpoint restricted to internal callers' };
    }
    reply.header('content-type', registry.contentType);
    return registry.metrics();
  });

  app.get('/api/v1/_ping', async () => ({ ok: true, ts: Date.now() }));

  app.get('/api/v1/_db/check', async (req, reply) => {
    if (!isMetricsAllowed({ allowFlag: env.ALLOW_METRICS === true, remoteIp: req.ip })) {
      reply.code(403);
      return { error: 'restricted to internal callers' };
    }
    const supa = createServerClient({ url: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
    let supabaseKongOk = false;
    let authUsers: number | null = null;
    try {
      const res = await supa.auth.admin.listUsers({ page: 1, perPage: 1 });
      supabaseKongOk = !res.error;
      authUsers = res.data?.users?.length ?? 0;
    } catch (err) {
      supabaseKongOk = false;
      req.log.warn({ err }, 'supabase_admin_api_failed');
    }
    const rows = await db.select().from(meta);
    return {
      schema: 'zhiyu',
      _meta_rows: rows.length,
      _meta_sample: rows.slice(0, 5),
      supabase_kong_ok: supabaseKongOk,
      auth_users: authUsers,
    };
  });

  app.post('/api/v1/_ping/queue', async (req) => {
    const job = await noopQueue.add('noop', { origin: req.ip, ts: Date.now() }, { removeOnComplete: 100 });
    return { enqueued: true, job_id: job.id };
  });

  app.post('/api/v1/_telemetry/error', async (req, reply) => {
    const parsed = telemetrySchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const payload = parsed.data;
    const ctxJson = payload.context ? JSON.stringify(payload.context) : null;
    await db.insert(errorEvents).values({
      env: env.APP_ENV,
      service: env.SERVICE_NAME,
      version: VERSION,
      level: payload.level,
      fingerprint: payload.fingerprint ?? null,
      message: payload.message,
      stack: payload.stack ?? null,
      context: ctxJson,
    });
    return { ok: true };
  });

  // Convenience for ZY-01-06 D acceptance. Internal only.
  app.get('/_debug/throw', async (req, reply) => {
    if (!isMetricsAllowed({ allowFlag: env.ALLOW_METRICS === true, remoteIp: req.ip })) {
      reply.code(403);
      return { error: 'restricted to internal callers' };
    }
    throw new Error('debug-throw triggered');
  });

  // Lightweight ad-hoc DB sanity (used in tests).
  app.get('/api/v1/_db/_select1', async () => {
    const r = await db.execute(sql`select 1 as ok`);
    return { result: r };
  });

  // E03 user account
  await registerAuthRoutes(app);
  await registerMeRoutes(app);
  await registerSessionRoutes(app);
  await registerGdprRoutes(app);

  // E04 i18n + content translations
  await registerI18n(app);
  await registerTranslationRoutes(app);

  // E05 app shell — search + notifications
  await registerSearchRoutes(app);
  await registerNotificationRoutes(app);
}
