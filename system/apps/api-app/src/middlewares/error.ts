import type { Context } from 'hono';

export class AppError extends Error {
  constructor(
    public code: number,
    message: string,
    public http = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({ code: err.code, message: err.message, details: err.details }, err.http as 400);
  }
  // eslint-disable-next-line no-console
  console.error('[unhandled]', err);
  return c.json({ code: 50000, message: 'internal error' }, 500);
}
