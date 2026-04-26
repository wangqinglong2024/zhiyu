/**
 * E07 ZY-07-04 — Wordbook + mistake log endpoints.
 *
 * Routes:
 *   GET    /api/v1/me/wordbook
 *   POST   /api/v1/me/wordbook                — manual add (also creates SRS)
 *   DELETE /api/v1/me/wordbook/:id
 *   GET    /api/v1/me/wordbook/export.csv     — text/csv stream
 *   GET    /api/v1/me/mistakes                — list (filterable)
 *   POST   /api/v1/me/mistakes/:id/redo       — mark resolved
 *   GET    /api/v1/me/mistakes/export.csv
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { mistakeLog, srsCards, vocabItems } from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';

const idParam = z.object({ id: z.string() });
const addVocab = z.object({
  word: z.string().min(1).max(20),
  pinyin: z.string().max(40).optional(),
  meaning: z.string().max(200).optional(),
  source: z.string().max(40).optional(),
  hsk_level: z.number().int().min(0).max(9).optional(),
  notes: z.string().max(500).optional(),
});

export async function registerWordbookMistakeRoutes(app: FastifyInstance): Promise<void> {
  // ---- Wordbook ------------------------------------------------------
  app.get('/api/v1/me/wordbook', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const q = (req.query as { source?: string; limit?: string; cursor?: string }) ?? {};
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 30)));
    const where = q.source
      ? and(eq(vocabItems.userId, user.id), eq(vocabItems.source, q.source))
      : eq(vocabItems.userId, user.id);
    const rows = await db
      .select()
      .from(vocabItems)
      .where(where)
      .orderBy(desc(vocabItems.createdAt))
      .limit(limit + 1);
    const has_more = rows.length > limit;
    return { items: rows.slice(0, limit), has_more };
  });

  app.post('/api/v1/me/wordbook', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = addVocab.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const today = new Date().toISOString().slice(0, 10);
    const result = await db.transaction(async (tx) => {
      const [vocab] = await tx
        .insert(vocabItems)
        .values({
          userId: user.id,
          word: parsed.data.word,
          pinyin: parsed.data.pinyin ?? null,
          meaning: parsed.data.meaning ?? null,
          source: parsed.data.source ?? 'manual',
          hskLevel: parsed.data.hsk_level ?? 1,
          notes: parsed.data.notes ?? null,
        })
        .onConflictDoNothing()
        .returning();
      // Always seed an SRS card too (unique by user+word).
      await tx
        .insert(srsCards)
        .values({
          userId: user.id,
          word: parsed.data.word,
          pinyin: parsed.data.pinyin ?? null,
          meaning: parsed.data.meaning ?? null,
          source: parsed.data.source ?? 'manual',
          dueAt: today as unknown as string,
        })
        .onConflictDoNothing();
      return vocab ?? null;
    });
    if (!result) {
      reply.code(409);
      return { error: 'already_exists' };
    }
    return { item: result };
  });

  app.delete('/api/v1/me/wordbook/:id', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const deleted = await db
      .delete(vocabItems)
      .where(and(eq(vocabItems.id, parsed.data.id), eq(vocabItems.userId, user.id)))
      .returning({ id: vocabItems.id });
    if (deleted.length === 0) {
      reply.code(404);
      return { error: 'not_found' };
    }
    return { ok: true };
  });

  app.get('/api/v1/me/wordbook/export.csv', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const rows = await db.select().from(vocabItems).where(eq(vocabItems.userId, user.id));
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="wordbook.csv"');
    const lines = ['word,pinyin,meaning,source,hsk_level,created_at'];
    for (const r of rows) {
      lines.push(
        [r.word, r.pinyin ?? '', r.meaning ?? '', r.source, r.hskLevel, r.createdAt?.toISOString() ?? ''].map(csvCell).join(','),
      );
    }
    return lines.join('\n');
  });

  // ---- Mistakes ------------------------------------------------------
  app.get('/api/v1/me/mistakes', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const q = (req.query as { resolved?: string; lesson_id?: string; limit?: string }) ?? {};
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 30)));
    const conds = [eq(mistakeLog.userId, user.id)];
    if (q.resolved === 'true') conds.push(sql`${mistakeLog.resolvedAt} IS NOT NULL`);
    if (q.resolved === 'false') conds.push(isNull(mistakeLog.resolvedAt));
    if (q.lesson_id) conds.push(eq(mistakeLog.lessonId, q.lesson_id));
    const rows = await db
      .select()
      .from(mistakeLog)
      .where(and(...conds))
      .orderBy(desc(mistakeLog.createdAt))
      .limit(limit + 1);
    return { items: rows.slice(0, limit), has_more: rows.length > limit };
  });

  app.post('/api/v1/me/mistakes/:id/redo', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const id = Number(parsed.data.id);
    if (!Number.isFinite(id)) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const updated = await db
      .update(mistakeLog)
      .set({ resolvedAt: new Date() })
      .where(and(eq(mistakeLog.id, id), eq(mistakeLog.userId, user.id)))
      .returning({ id: mistakeLog.id });
    if (updated.length === 0) {
      reply.code(404);
      return { error: 'not_found' };
    }
    return { ok: true };
  });

  app.get('/api/v1/me/mistakes/export.csv', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const rows = await db.select().from(mistakeLog).where(eq(mistakeLog.userId, user.id));
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="mistakes.csv"');
    const lines = ['id,lesson_id,step_index,question_id,source,resolved_at,created_at'];
    for (const r of rows) {
      lines.push(
        [
          r.id,
          r.lessonId ?? '',
          r.stepIndex ?? '',
          r.questionId ?? '',
          r.source,
          r.resolvedAt?.toISOString() ?? '',
          r.createdAt?.toISOString() ?? '',
        ]
          .map(csvCell)
          .join(','),
      );
    }
    return lines.join('\n');
  });
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
