/**
 * E09 ZY-09-10 — Leaderboard refresh cron.
 *
 * Every 5 minutes, recomputes top-100 per known game per scope and writes
 * into `zhiyu.leaderboards` so the API can serve from cache. Scopes are
 * derived from `zhiyu.game_runs` rows directly, so adding a new game just
 * means accumulating runs for it.
 */
import { Queue, QueueEvents, Worker, type Job } from 'bullmq';
import postgres from 'postgres';
import type { Logger } from 'pino';
import { loadEnv } from '@zhiyu/config';

const env = loadEnv();
const QUEUE = 'leaderboard-refresh';
const SCOPES = ['daily', 'week', 'month', 'all'] as const;
type Scope = (typeof SCOPES)[number];

/** Cutoff date used in the SQL aggregate (rolling window). */
function scopeCutoff(scope: Scope): Date | null {
  const now = Date.now();
  switch (scope) {
    case 'daily': return new Date(now - 86_400_000);
    case 'week':  return new Date(now - 7 * 86_400_000);
    case 'month': return new Date(now - 30 * 86_400_000);
    default: return null;
  }
}

/**
 * Stable bucket key for the (game_id, scope, period_start) UPSERT primary key.
 * For rolling windows we still want exactly one cached row per (game, scope),
 * so we use a constant sentinel timestamp rather than `now()` which would
 * drift on every cron tick and cause unbounded row growth.
 */
const PERIOD_BUCKET = new Date('1970-01-01T00:00:00Z');

export interface LeaderboardCronHandles {
  stop(): Promise<void>;
}

export function startLeaderboardCron(
  connection: ReturnType<typeof import('ioredis').Redis.prototype.duplicate>,
  logger: Logger,
): LeaderboardCronHandles {
  const queue = new Queue(QUEUE, { connection });
  const events = new QueueEvents(QUEUE, { connection: connection.duplicate() });

  events.on('failed', ({ jobId, failedReason }) =>
    logger.warn({ jobId, failedReason }, 'leaderboard_failed'),
  );

  const sql = postgres(env.DATABASE_URL, { max: 2, idle_timeout: 30 });

  const worker = new Worker(
    QUEUE,
    async (_job: Job) => {
      const start = Date.now();
      const games = await sql<{ game_id: string }[]>`
        SELECT DISTINCT game_id FROM zhiyu.game_runs
      `;
      let written = 0;
      for (const { game_id } of games) {
        for (const scope of SCOPES) {
          const since = scopeCutoff(scope);
          const rows = since
            ? await sql<{ user_id: string; score: number; duration_ms: number; created_at: Date }[]>`
                SELECT user_id,
                       max(score)::int        AS score,
                       min(duration_ms)::int  AS duration_ms,
                       max(created_at)        AS created_at
                  FROM zhiyu.game_runs
                 WHERE game_id = ${game_id}
                   AND created_at >= ${since}
                 GROUP BY user_id
                 ORDER BY score DESC
                 LIMIT 100
              `
            : await sql<{ user_id: string; score: number; duration_ms: number; created_at: Date }[]>`
                SELECT user_id,
                       max(score)::int        AS score,
                       min(duration_ms)::int  AS duration_ms,
                       max(created_at)        AS created_at
                  FROM zhiyu.game_runs
                 WHERE game_id = ${game_id}
                 GROUP BY user_id
                 ORDER BY score DESC
                 LIMIT 100
              `;
          const ranks = rows.map((r, i) => ({
            rank: i + 1,
            user_id: r.user_id,
            score: r.score,
            duration_ms: r.duration_ms,
            created_at: r.created_at,
          }));
          await sql`
            INSERT INTO zhiyu.leaderboards (game_id, scope, period_start, period_end, ranks, refreshed_at)
            VALUES (
              ${game_id},
              ${scope},
              ${PERIOD_BUCKET},
              ${new Date()},
              ${sql.json(ranks)},
              now()
            )
            ON CONFLICT (game_id, scope, period_start)
            DO UPDATE SET ranks = excluded.ranks, refreshed_at = now(), period_end = excluded.period_end
          `;
          written += 1;
        }
      }
      const duration_ms = Date.now() - start;
      logger.info({ games: games.length, leaderboards_written: written, duration_ms }, 'leaderboard_refresh_done');
      return { games: games.length, leaderboards_written: written, duration_ms };
    },
    { connection, concurrency: 1 },
  );

  worker.on('error', (err) => logger.error({ err }, 'leaderboard_worker_error'));

  // Repeatable every 5 minutes.
  void queue.add(
    'leaderboard-refresh-cron',
    { source: 'cron' },
    {
      repeat: { every: 5 * 60_000 },
      jobId: 'leaderboard-refresh-cron',
      removeOnComplete: 50,
      removeOnFail: 50,
    },
  );

  return {
    async stop(): Promise<void> {
      await worker.close();
      await events.close();
      await queue.close();
      await sql.end({ timeout: 5 });
    },
  };
}
