/**
 * ZY-09-10 — Game runs + leaderboards.
 *
 * - POST /api/v1/games/:id/runs   (auth) submit a finished round
 * - GET  /api/v1/games/:id/leaderboard?scope=all|week|month|daily
 *
 * Anti-cheat keeps it simple at the API layer: per-user rate-limit + clamped
 * score/duration ranges. Heavy validation (impossible APM, statistical
 * outliers) is the worker's job in a future iteration.
 */
import type { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, sql as sqlExpr } from 'drizzle-orm';
import { z } from 'zod';
import { db, rawClient } from '../db.js';
import { gameRuns, leaderboards } from '@zhiyu/db';
import { requireUser, getOptionalUser } from '../auth-mw.js';

const slugSchema = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/);
const runSchema = z.object({
  score: z.number().int().min(0).max(1_000_000),
  duration_ms: z.number().int().min(1_000).max(600_000),
  meta: z.record(z.unknown()).optional(),
});
const scopeSchema = z.enum(['all', 'week', 'month', 'daily']).default('week');

/** Accept the spec-mandated `?range=daily|weekly|all` aliases. */
function normalizeScope(raw: string | undefined): z.infer<typeof scopeSchema> {
  const v = (raw ?? 'week').toLowerCase();
  if (v === 'weekly') return 'week';
  if (v === 'monthly') return 'month';
  if (v === 'all' || v === 'week' || v === 'month' || v === 'daily') return v;
  return 'week';
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12; // a user may submit 12 runs per minute
const recent = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const list = recent.get(userId) ?? [];
  const fresh = list.filter((t) => now - t < RATE_WINDOW_MS);
  fresh.push(now);
  recent.set(userId, fresh);
  return fresh.length > RATE_MAX;
}

function scopeStart(scope: z.infer<typeof scopeSchema>): Date | null {
  const now = Date.now();
  switch (scope) {
    case 'daily':
      return new Date(now - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export async function registerGameRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/games/:id/runs', async (req, reply) => {
    const idParsed = slugSchema.safeParse((req.params as { id: string }).id);
    if (!idParsed.success) {
      reply.code(400);
      return { error: 'invalid_game_id' };
    }
    const user = await requireUser(req, reply);
    if (!user) return;
    if (rateLimited(user.id)) {
      reply.code(429);
      return { error: 'rate_limited' };
    }
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const inserted = await rawClient<{ id: bigint }[]>`
      INSERT INTO zhiyu.game_runs (user_id, game_id, score, duration_ms, meta)
      VALUES (${user.id}, ${idParsed.data}, ${parsed.data.score}, ${parsed.data.duration_ms}, ${rawClient.json((parsed.data.meta ?? {}) as Record<string, unknown> as never)})
      RETURNING id
    `;
    const runId = String(inserted[0]?.id ?? '');
    return { ok: true, run_id: runId };
  });

  app.get('/api/v1/games/:id/leaderboard', async (req, reply) => {
    const idParsed = slugSchema.safeParse((req.params as { id: string }).id);
    if (!idParsed.success) {
      reply.code(400);
      return { error: 'invalid_game_id' };
    }
    const q = req.query as { scope?: string; range?: string };
    const scope = normalizeScope(q.range ?? q.scope);

    // Try cached leaderboard first.
    const cached = await db
      .select()
      .from(leaderboards)
      .where(and(eq(leaderboards.gameId, idParsed.data), eq(leaderboards.scope, scope)))
      .orderBy(desc(leaderboards.refreshedAt))
      .limit(1);
    if (cached[0] && Array.isArray(cached[0].ranks) && (cached[0].ranks as unknown[]).length > 0) {
      return {
        game_id: idParsed.data,
        scope,
        refreshed_at: cached[0].refreshedAt,
        entries: cached[0].ranks,
      };
    }

    // Fallback: live aggregate (top 50). Slow path.
    const startAt = scopeStart(scope);
    const conditions = [eq(gameRuns.gameId, idParsed.data)];
    if (startAt) conditions.push(gte(gameRuns.createdAt, startAt));
    const rows = await db
      .select({
        userId: gameRuns.userId,
        score: sqlExpr<number>`max(${gameRuns.score})`.as('score'),
        durationMs: sqlExpr<number>`min(${gameRuns.durationMs})`.as('duration_ms'),
        createdAt: sqlExpr<Date>`max(${gameRuns.createdAt})`.as('created_at'),
      })
      .from(gameRuns)
      .where(and(...conditions))
      .groupBy(gameRuns.userId)
      .orderBy(desc(sqlExpr`max(${gameRuns.score})`))
      .limit(50);

    const entries = rows.map((r, i) => ({
      rank: i + 1,
      user_id: r.userId,
      score: Number(r.score),
      duration_ms: Number(r.durationMs),
      created_at: r.createdAt,
    }));

    // Self rank if authed.
    const me = await getOptionalUser(req);
    let self: { rank: number; score: number } | null = null;
    if (me) {
      const idx = entries.findIndex((e) => e.user_id === me.id);
      if (idx >= 0) self = { rank: entries[idx]!.rank, score: entries[idx]!.score };
    }

    reply.header('cache-control', 'public, max-age=30');
    return {
      game_id: idParsed.data,
      scope,
      refreshed_at: null,
      entries,
      self,
    };
  });
}
