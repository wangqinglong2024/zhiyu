import type { Context } from 'hono';
import { CHINA_ERROR_CODE_MAP } from '@zhiyu/shared-schemas';
import { AppError } from './error.ts';
import { getRequestId, nowIso } from './request-id.ts';

/** 统一成功响应封装 */
export function ok<T>(c: Context, data: T, message = 'ok') {
  return c.json({
    code: 0,
    message,
    data,
    request_id: getRequestId(c),
    server_time: nowIso(),
  });
}

/** 统一错误抛出（按字符串码自动映射 HTTP 状态与数值码） */
export function failByCode(stringCode: string, message?: string, details?: unknown): never {
  const m = CHINA_ERROR_CODE_MAP[stringCode];
  if (m) {
    throw new AppError(m.code, message ?? stringCode, m.http, details);
  }
  throw new AppError(50000, message ?? stringCode, 500, details);
}
