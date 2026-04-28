import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './env.ts';
import { requestId } from './middlewares/request-id.ts';
import { errorHandler } from './middlewares/error.ts';
import { healthRoutes } from './routes/health.routes.ts';
import { authRoutes } from './routes/auth.routes.ts';
import { usersRoutes } from './routes/users.routes.ts';
import { mountAdminChinaRoutes } from './routes/china/index.ts';

export function buildAdminApp(env: Env) {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', requestId());
  const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:4100')
    .split(',').map((s) => s.trim()).filter(Boolean);
  app.use('*', cors({
    origin: corsOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 600,
  }));

  app.get('/', (c) => c.json({ code: 0, data: { service: 'zhiyu-api-admin', env: env.APP_ENV } }));
  app.route('/admin/v1/health', healthRoutes(env));
  app.route('/admin/v1/auth', authRoutes(env));
  app.route('/admin/v1/users', usersRoutes(env));
  mountAdminChinaRoutes(app, env);

  app.onError(errorHandler);
  app.notFound((c) => c.json({ code: 40400, message: 'not found' }, 404));

  return app;
}
