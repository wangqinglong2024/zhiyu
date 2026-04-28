import type { Context, Next } from 'hono';
import IORedis from 'ioredis';
import { AppError } from './error.ts';
import type { Env } from '../env.ts';

let redis: IORedis | null = null;
function getRedis(env: Env): IORedis | null {
  if (redis) return redis;
  try {
    redis = new IORedis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 1 });
    redis.on('error', (e) => {
      // eslint-disable-next-line no-console
      console.warn('[rate-limit] redis error', e.message);
    });
    return redis;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[rate-limit] redis init failed, fallback to noop', (e as Error).message);
    return null;
  }
}

export interface RateLimitOptions {
  /** 桶名，决定 key 前缀 */
  bucket: string;
  /** 时间窗口（秒） */
  windowSec: number;
  /** 窗口内允许次数 */
  max: number;
  /** key 函数：默认按 IP */
  keyFn?: (c: Context) => string;
  /** 业务码字符串（china 域常用） */
  errorCode?: string;
  /** 数值 code 与 HTTP 状态 */
  errorNumeric?: number;
  http?: number;
}

function clientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

/** 简单令牌桶式：基于 redis INCR + EXPIRE */
export function rateLimit(env: Env, opts: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const r = getRedis(env);
    if (!r) {
      // 无 redis 时不阻断
      await next();
      return;
    }
    const key = `rl:${opts.bucket}:${(opts.keyFn ?? clientIp)(c)}`;
    try {
      const v = await r.incr(key);
      if (v === 1) {
        await r.expire(key, opts.windowSec);
      }
      if (v > opts.max) {
        const code = opts.errorNumeric ?? 42900;
        const http = opts.http ?? 429;
        c.header('Retry-After', String(opts.windowSec));
        throw new AppError(code, opts.errorCode ?? 'RATE_LIMITED', http);
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      // redis 抖动时不阻断
      // eslint-disable-next-line no-console
      console.warn('[rate-limit] noop due to redis err', (e as Error).message);
    }
    await next();
  };
}
