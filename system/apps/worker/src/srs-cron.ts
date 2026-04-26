/**
 * E07 ZY-07-03 — SRS daily recommendation worker.
 *
 * Runs once per day (BullMQ repeatable job, cron 0 1 * * * — 01:00
 * Asia/Shanghai). For each user with at least one due card today, enqueues a
 * `notifications` event reminding them. We push directly into Postgres
 * `zhiyu.notifications` (E05) so the FE realtime channel picks it up.
 *
 * For dev convenience, the worker also exposes a one-shot trigger via the
 * `srs:run` queue.
 */
import { Queue, QueueEvents, Worker, type Job } from 'bullmq';
import postgres from 'postgres';
import type { Logger } from 'pino';
import { loadEnv } from '@zhiyu/config';

const env = loadEnv();

export interface SrsCronHandles {
  stop(): Promise<void>;
}

const QUEUE = 'srs-daily';

export function startSrsCron(connection: ReturnType<typeof import('ioredis').Redis.prototype.duplicate>, logger: Logger): SrsCronHandles {
  const queue = new Queue(QUEUE, { connection });
  const events = new QueueEvents(QUEUE, { connection: connection.duplicate() });

  events.on('completed', ({ jobId, returnvalue }) =>
    logger.info({ jobId, returnvalue }, 'srs_daily_completed'),
  );
  events.on('failed', ({ jobId, failedReason }) =>
    logger.warn({ jobId, failedReason }, 'srs_daily_failed'),
  );

  const sql = postgres(env.DATABASE_URL, { max: 2, idle_timeout: 30 });

  const worker = new Worker(
    QUEUE,
    async (_job: Job) => {
      const start = Date.now();
      // Find all (user_id, due_count) for cards due today (Asia/Shanghai not
      // critical here — DB date is OK for an estimate).
      const due = await sql<{ user_id: string; due: number }[]>`
        SELECT user_id, count(*)::int AS due
          FROM zhiyu.srs_cards
         WHERE due_at <= current_date
         GROUP BY user_id
      `;
      let inserted = 0;
      for (const row of due) {
        try {
          await sql`
            INSERT INTO zhiyu.notifications (user_id, kind, title, body, payload)
            VALUES (
              ${row.user_id},
              'srs_due',
              'Time to review',
              ${`You have ${row.due} cards waiting today.`},
              ${sql.json({ count: row.due })}
            )
          `;
          inserted += 1;
        } catch (err) {
          logger.warn({ err, user_id: row.user_id }, 'srs_notification_insert_failed');
        }
      }
      const duration_ms = Date.now() - start;
      logger.info({ users: due.length, notifications: inserted, duration_ms }, 'srs_daily_run');
      return { users: due.length, notifications: inserted, duration_ms };
    },
    { connection, concurrency: 1 },
  );

  worker.on('error', (err) => logger.error({ err }, 'srs_worker_error'));

  // Schedule a repeatable job (cron). 01:00 every day. BullMQ repeatable keys
  // are idempotent so re-running is safe.
  void queue.add(
    'srs-daily-cron',
    { source: 'cron' },
    {
      repeat: { pattern: '0 1 * * *', tz: 'Asia/Shanghai' },
      jobId: 'srs-daily-cron',
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
