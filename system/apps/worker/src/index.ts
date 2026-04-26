import { Queue, QueueEvents, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import pino from 'pino';
import { loadEnv } from '@zhiyu/config';
import { startGdprWorkers } from './gdpr.js';
import { startSrsCron } from './srs-cron.js';
import { startLeaderboardCron } from './leaderboard-cron.js';

const env = loadEnv();
const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'zhiyu-worker', env: env.APP_ENV, version: env.GIT_SHA ?? '0.1.0' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });
const NOOP_QUEUE = 'noop';

const noopQueue = new Queue(NOOP_QUEUE, { connection });
const events = new QueueEvents(NOOP_QUEUE, { connection: connection.duplicate() });

events.on('completed', ({ jobId }) => logger.debug({ jobId }, 'noop_completed_event'));
events.on('failed', ({ jobId, failedReason }) => logger.warn({ jobId, failedReason }, 'noop_failed_event'));

const worker = new Worker(
  NOOP_QUEUE,
  async (job: Job) => {
    const start = Date.now();
    // Trivial unit of work: echo the timestamp.
    const out = { jobId: job.id, receivedAt: Date.now(), data: job.data };
    const duration_ms = Date.now() - start;
    logger.info({ msg: 'noop_processed', job_id: job.id, duration_ms }, 'noop_processed');
    return out;
  },
  { connection, concurrency: 4 },
);

worker.on('error', (err) => logger.error({ err }, 'worker_error'));

// Heartbeat producer: every 30s schedule a self-noop so logs always show life.
const HEARTBEAT_MS = Number(process.env.NOOP_HEARTBEAT_MS ?? 30_000);
let timer: NodeJS.Timeout | undefined;
function startHeartbeat(): void {
  timer = setInterval(() => {
    noopQueue
      .add('noop', { origin: 'worker-heartbeat', ts: Date.now() }, { removeOnComplete: 50, removeOnFail: 50 })
      .catch((err) => logger.warn({ err }, 'heartbeat_enqueue_failed'));
  }, HEARTBEAT_MS).unref();
}

logger.info({ queue: NOOP_QUEUE, heartbeat_ms: HEARTBEAT_MS }, 'zhiyu-worker started');
startHeartbeat();
const gdpr = startGdprWorkers(connection.duplicate());
const srsCron = startSrsCron(connection.duplicate(), logger);
const leaderboardCron = startLeaderboardCron(connection.duplicate(), logger);

const stop = async (sig: string) => {
  logger.info({ sig }, 'shutting_down');
  if (timer) clearInterval(timer);
  await gdpr.stop();
  await srsCron.stop();
  await leaderboardCron.stop();
  await worker.close();
  await events.close();
  await noopQueue.close();
  await connection.quit();
  process.exit(0);
};
process.on('SIGINT', () => void stop('SIGINT'));
process.on('SIGTERM', () => void stop('SIGTERM'));
