import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health.routes.ts';
import { authRoutes } from './routes/auth.routes.ts';
import { discoverRoutes } from './routes/discover.routes.ts';
import { meRoutes } from './routes/me.routes.ts';
import type { Env } from './env.ts';
import { errorHandler } from './middlewares/error.ts';

export function buildApp(env: Env) {
  const app = new Hono();

  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: ['http://localhost:3100', 'http://localhost:4100'],
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposeHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );

  app.get('/', (c) => c.json({ code: 0, data: { service: 'zhiyu-api-app', env: env.APP_ENV } }));

  app.route('/api/v1/health', healthRoutes(env));
  app.route('/api/v1/auth', authRoutes(env));
  app.route('/api/v1/discover', discoverRoutes(env));
  app.route('/api/v1/me', meRoutes(env));

  app.onError(errorHandler);
  app.notFound((c) => c.json({ code: 40400, message: 'not found' }, 404));

  return app;
}
