/**
 * ZY-09-08 — WordPack delivery API.
 *
 * Reads from `zhiyu.wordpacks` (seeded by 0007 migration). Public read, cached
 * for 5 minutes via `cache-control` header. Engine `WordPackLoader` consumes
 * `/api/v1/wordpacks/:id`.
 */
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db.js';
import { wordpacks } from '@zhiyu/db';

const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9._-]+$/);

export async function registerWordpackRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/wordpacks/:id', async (req, reply) => {
    const parsed = idSchema.safeParse((req.params as { id: string }).id);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const rows = await db.select().from(wordpacks).where(eq(wordpacks.id, parsed.data)).limit(1);
    const row = rows[0];
    if (!row) {
      reply.code(404);
      return { error: 'not_found', id: parsed.data };
    }
    reply.header('cache-control', 'public, max-age=300');
    return {
      id: row.id,
      hsk_level: row.hskLevel,
      items: row.items,
      updated_at: row.updatedAt,
    };
  });
}
