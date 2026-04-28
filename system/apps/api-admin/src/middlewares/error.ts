import type { Context } from 'hono';
import { ZodError } from 'zod';
import { CHINA_ERROR_CODE_MAP } from '@zhiyu/shared-schemas';
import { getRequestId, nowIso } from './request-id.ts';

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

export function mapPgErrorMessage(msg: string): AppError | null {
  if (!msg) return null;
  const tokens = msg.match(/CHINA_[A-Z_]+/g);
  if (!tokens) return null;
  const m = CHINA_ERROR_CODE_MAP[tokens[0]];
  if (!m) return null;
  return new AppError(m.code, tokens[0], m.http);
}

export function errorHandler(err: Error, c: Context) {
  const baseMeta = { request_id: getRequestId(c), server_time: nowIso() };
  if (err instanceof AppError) {
    return c.json(
      { code: err.code, message: err.message, details: err.details, ...baseMeta },
      err.http as 400,
    );
  }
  if (err instanceof ZodError) {
    return c.json(
      { code: 40001, message: 'validation_failed', details: err.flatten(), ...baseMeta },
      400,
    );
  }
  const mapped = mapPgErrorMessage((err as { message?: string }).message ?? '');
  if (mapped) {
    return c.json({ code: mapped.code, message: mapped.message, ...baseMeta }, mapped.http as 400);
  }
  // eslint-disable-next-line no-console
  console.error('[admin]', err);
  return c.json({ code: 50000, message: 'internal error', ...baseMeta }, 500);
}
