import type { FastifyReply, FastifyRequest } from 'fastify';
import { supaAdmin, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, type AuthUser } from './supa.js';

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };


/** Parse cookies from a single Cookie header without adding fastify-cookie. */
export function parseCookies(req: FastifyRequest): Record<string, string> {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}

export function setCookie(reply: FastifyReply, name: string, value: string, maxAgeSec: number): void {
  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `Max-Age=${maxAgeSec}`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];
  if (process.env.APP_ENV === 'production') segments.push('Secure');
  appendCookie(reply, segments.join('; '));
}

export function clearCookie(reply: FastifyReply, name: string): void {
  appendCookie(reply, `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function appendCookie(reply: FastifyReply, value: string): void {
  const existing = reply.getHeader('set-cookie');
  if (!existing) {
    reply.header('set-cookie', value);
  } else if (Array.isArray(existing)) {
    reply.header('set-cookie', [...existing, value]);
  } else {
    reply.header('set-cookie', [String(existing), value]);
  }
}

/**
 * Extract bearer token from Authorization header or our cookie.
 */
export function getAccessToken(req: FastifyRequest): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookies = parseCookies(req);
  return cookies[ACCESS_TOKEN_COOKIE] ?? null;
}

/** Resolve the current user from access token via supabase admin. */
export async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const token = getAccessToken(req);
  if (!token) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
  const { data, error } = await supaAdmin.auth.getUser(token);
  if (error || !data.user) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
  const meta = (data.user.app_metadata ?? {}) as { role?: string };
  const role: AuthUser['role'] = meta.role === 'admin' ? 'admin' : 'user';
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    sessionId: (data.user as { session_id?: string }).session_id ?? null,
    role,
  };
}

/** Like `requireUser` but enforces `app_metadata.role === 'admin'`. */
export async function requireAdminUser(req: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const user = await requireUser(req, reply);
  if (!user) return null;
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'forbidden' });
    return null;
  }
  return user;
}

/**
 * Resolve user without sending a 401 when the token is missing/invalid.
 * Useful for routes that work for anon users but personalise when authed.
 */
export async function getOptionalUser(req: FastifyRequest): Promise<AuthUser | null> {
  const token = getAccessToken(req);
  if (!token) return null;
  try {
    const { data, error } = await supaAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    const meta = (data.user.app_metadata ?? {}) as { role?: string };
    const role: AuthUser['role'] = meta.role === 'admin' ? 'admin' : 'user';
    return {
      id: data.user.id,
      email: data.user.email ?? null,
      sessionId: (data.user as { session_id?: string }).session_id ?? null,
      role,
    };
  } catch {
    return null;
  }
}
