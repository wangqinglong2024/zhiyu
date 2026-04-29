const ADMIN_API = (import.meta.env.VITE_API_BASE_ADMIN as string) || 'http://localhost:9100/admin/v1';

export class AdminApiError extends Error {
  code: number;
  status: number;
  details?: unknown;
  constructor(message: string, code: number, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * 全局错误监听：业务页面通过 `subscribeAdminApiError` 注册一次回调，
 * 由 ToastProvider 包裹层接到错误后统一弹 toast，避免每个 useQuery 单独写 onError。
 */
type ErrorListener = (err: AdminApiError) => void;
const errorListeners = new Set<ErrorListener>();
export function subscribeAdminApiError(fn: ErrorListener): () => void {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}
function emitAdminError(err: AdminApiError): void {
  for (const fn of errorListeners) {
    try { fn(err); } catch { /* ignore listener errors */ }
  }
}

export async function adminApi<T>(path: string, opts: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ADMIN_API + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
      credentials: 'include',
    });
  } catch (e) {
    const err = new AdminApiError('network_error', 0, 0, (e as Error).message);
    emitAdminError(err);
    throw err;
  }
  let json: { code?: number; data?: T; message?: string; details?: unknown } = {};
  try { json = (await res.json()) as never; } catch { /* noop */ }

  if (res.status === 401) {
    // 未登录 → 跳转登录页
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      const back = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?redirect=${back}`);
    }
    throw new AdminApiError('auth.required', json.code ?? 401, 401, json.details);
  }
  if (res.status === 403) {
    // 已登录但权限不足 → 不再死循环跳转，弹 toast 提示并保留页面 inline error
    const err = new AdminApiError('forbidden', json.code ?? 40300, 403, json.details);
    emitAdminError(err);
    throw err;
  }
  if (!res.ok || (typeof json.code === 'number' && json.code !== 0)) {
    const err = new AdminApiError(json.message || `http_${res.status}`, json.code ?? res.status, res.status, json.details);
    emitAdminError(err);
    throw err;
  }
  return (json.data as T) ?? (undefined as never);
}
