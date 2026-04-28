import { randomBytes } from 'node:crypto';
import type { Context, Next } from 'hono';

export function requestId() {
  return async (c: Context, next: Next) => {
    const incoming = c.req.header('x-request-id');
    const id = incoming && /^[A-Za-z0-9._-]{8,128}$/.test(incoming)
      ? incoming
      : 'req_' + randomBytes(8).toString('hex');
    c.set('request_id', id);
    c.header('X-Request-Id', id);
    await next();
  };
}

export function getRequestId(c: Context): string {
  return (c.get('request_id') as string) || '';
}

export function nowIso(): string {
  return new Date().toISOString();
}
