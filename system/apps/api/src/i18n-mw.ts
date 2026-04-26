import type { FastifyInstance, FastifyRequest } from 'fastify';
import { parseAcceptLanguage, type UiLocale } from '@zhiyu/i18n';
import { makeT, type ServerT } from '@zhiyu/i18n/server';

declare module 'fastify' {
  interface FastifyRequest {
    locale: UiLocale;
    t: ServerT;
  }
}

/**
 * Per-request locale resolution:
 *   1) explicit `?lang=` query (allow-listed)
 *   2) `x-locale` header
 *   3) Accept-Language with q-weights
 *
 * Always sets a UI locale (falls back to 'en'). Also writes
 * `content-language` on the response so caches can vary.
 */
export async function registerI18n(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (req, reply) => {
    const lang = pickLang(req);
    req.locale = lang;
    req.t = makeT(lang);
    reply.header('content-language', lang);
  });
}

function pickLang(req: FastifyRequest): UiLocale {
  const q = (req.query as Record<string, string | undefined> | undefined)?.lang;
  if (q) return parseAcceptLanguage(q);
  const x = req.headers['x-locale'];
  if (typeof x === 'string' && x) return parseAcceptLanguage(x);
  const al = req.headers['accept-language'];
  return parseAcceptLanguage(typeof al === 'string' ? al : null);
}
