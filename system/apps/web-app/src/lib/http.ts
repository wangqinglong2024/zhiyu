const BASE = (import.meta.env.VITE_API_BASE_APP as string) || 'http://localhost:8100/api/v1';

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    credentials: 'include',
  });
  const json = (await res.json().catch(() => ({}))) as { code: number; data?: T; message?: string };
  if (!res.ok || (typeof json.code === 'number' && json.code !== 0)) {
    throw new Error(json.message || `http_${res.status}`);
  }
  return (json.data as T) ?? (undefined as never);
}
