import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health.routes.ts';
import { authRoutes } from './routes/auth.routes.ts';
import { meRoutes } from './routes/me.routes.ts';
import { mountChinaRoutes } from './routes/china/index.ts';
import { mountInternalRoutes } from './routes/internal/index.ts';
import { requestId } from './middlewares/request-id.ts';
import type { Env } from './env.ts';
import { errorHandler } from './middlewares/error.ts';

export function buildApp(env: Env) {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', requestId());
  const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:3100,http://localhost:4100')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    '*',
    cors({
      origin: corsOrigins,
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposeHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );

  app.get('/', (c) => c.json({ code: 0, data: { service: 'zhiyu-api-app', env: env.APP_ENV } }));

  app.route('/api/v1/health', healthRoutes(env));
  app.route('/api/v1/auth', authRoutes(env));
  app.route('/api/v1/me', meRoutes(env));
  mountChinaRoutes(app, env);
  mountInternalRoutes(app, env);

  app.onError(errorHandler);
  app.notFound((c) => c.json({ code: 40400, message: 'not found' }, 404));

  return app;
}
