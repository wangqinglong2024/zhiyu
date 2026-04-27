import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import client from 'prom-client';
import { randomUUID } from 'node:crypto';
import { failure, ok } from './response.js';
import { loadEnv } from './env.js';

export function createBaseApp(serviceName: string) {
  const env = loadEnv();
  const app = express();
  const logger = pino({ level: env.LOG_LEVEL, base: { service: serviceName, env: env.APP_ENV } });
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry, prefix: 'zhiyu_' });
  const httpTotal = new client.Counter({ name: 'http_request_total', help: 'HTTP requests', labelNames: ['method', 'route', 'status'], registers: [registry] });
  const httpDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP latency', labelNames: ['method', 'route'], registers: [registry] });

  app.disable('x-powered-by');
  const allowedOrigins = new Set(env.CORS_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean));
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('CORS origin is not allowed'));
    },
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    req.requestId = String(req.headers['x-request-id'] ?? randomUUID());
    res.setHeader('x-request-id', req.requestId);
    const endTimer = httpDuration.startTimer({ method: req.method, route: req.path });
    res.on('finish', () => {
      endTimer();
      httpTotal.inc({ method: req.method, route: req.path, status: String(res.statusCode) });
      logger.info({ req_id: req.requestId, method: req.method, path: req.path, status: res.statusCode }, 'request_completed');
    });
    next();
  });

  app.get('/health', (_req, res) => ok(res, { status: 'ok', version: process.env.npm_package_version ?? '0.1.0', uptime: process.uptime() }));
  app.get('/ready', (_req, res) => {
    const checks = {
      database: env.DATABASE_URL ? 'configured' : env.ALLOW_FAKE_DATABASE ? 'fake' : 'missing',
      redis: env.REDIS_URL ? 'configured' : env.ALLOW_FAKE_REDIS ? 'memory' : 'missing',
      supabase: env.SUPABASE_URL ? 'configured' : 'fixture-only'
    };
    const ready = checks.database !== 'missing' && checks.redis !== 'missing';
    return res.status(ready ? 200 : 503).json({ data: { status: ready ? 'ready' : 'not_ready', checks }, meta: null, error: null });
  });
  app.get('/metrics', async (req, res) => {
    const ip = req.ip || '';
    const bearer = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const internal = ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('172.');
    if (!internal && (!env.METRICS_TOKEN || bearer !== env.METRICS_TOKEN)) return failure(res, 403, 'METRICS_INTERNAL_ONLY', 'Metrics are restricted to internal network');
    res.setHeader('content-type', registry.contentType);
    return res.send(await registry.metrics());
  });

  return { app, env, logger };
}

export function installErrorHandler(app: express.Express) {
  const handler: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === 'number' ? err.status : 500;
    const code = err instanceof SyntaxError ? 'INVALID_JSON' : err?.code ?? 'INTERNAL_ERROR';
    const message = status === 500 ? 'Internal error' : err?.message ?? 'Request failed';
    return failure(res, status, code, message);
  };
  app.use(handler);
}