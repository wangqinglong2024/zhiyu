import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { charDict } from '@zhiyu/db';
import { db } from '../../db.js';

/**
 * GET /api/v1/discover/dict/:char
 * Single-character popup data. Public. Returns 404 if missing so the FE can
 * render a "no entry" state with a "request word" CTA in the future.
 */
export async function registerDiscoverDictRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/discover/dict/:char', async (req, reply) => {
    const ch = (req.params as { char: string }).char;
    if (!ch || ch.length === 0) {
      reply.code(400);
      return { error: 'invalid_char' };
    }
    // Take only the first code point (popup is for a single char).
    const first = [...ch][0] ?? ch;
    const [row] = await db.select().from(charDict).where(eq(charDict.ch, first)).limit(1);
    if (!row) {
      reply.code(404);
      return { error: 'char_not_found', ch: first };
    }
    return { entry: row };
  });
}
