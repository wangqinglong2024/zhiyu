/**
 * GameAnalytics (ZY-09-10)
 *
 * Buffered, fail-soft event reporter that POSTs to
 * `/api/v1/_telemetry/event`. Designed to be drop-in for every E10 game.
 *
 * No PostHog / 3rd-party SaaS — the backend writes into `zhiyu.events`.
 */
export interface AnalyticsEvent {
  name: string;
  props?: Record<string, unknown>;
  ts?: number;
}

export interface GameAnalyticsOptions {
  endpoint?: string;
  fetcher?: typeof fetch;
  flushIntervalMs?: number;
  maxBatchSize?: number;
  /** Optional getter for auth bearer token. */
  authToken?: () => string | null;
  /** Inject a logger; defaults to no-op. */
  log?: (msg: string, meta?: unknown) => void;
}

const DEFAULT_FLUSH_MS = 5_000;
const DEFAULT_MAX_BATCH = 25;

export class GameAnalytics {
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;
  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;
  private readonly authToken?: () => string | null;
  private readonly log: NonNullable<GameAnalyticsOptions['log']>;
  private readonly queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(opts: GameAnalyticsOptions = {}) {
    this.endpoint = opts.endpoint ?? '/api/v1/_telemetry/event';
    this.fetcher = opts.fetcher ?? globalThis.fetch.bind(globalThis);
    this.flushIntervalMs = opts.flushIntervalMs ?? DEFAULT_FLUSH_MS;
    this.maxBatchSize = opts.maxBatchSize ?? DEFAULT_MAX_BATCH;
    this.authToken = opts.authToken;
    this.log = opts.log ?? (() => undefined);
  }

  start(): void {
    if (this.timer || this.destroyed) return;
    this.timer = setInterval(() => {
      this.flush().catch((err) => this.log('analytics_flush_failed', err));
    }, this.flushIntervalMs);
    if (typeof this.timer === 'object' && this.timer && 'unref' in this.timer) {
      try {
        (this.timer as unknown as { unref(): void }).unref();
      } catch {
        /* node-only */
      }
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  destroy(): void {
    this.stop();
    this.destroyed = true;
  }

  track(name: string, props?: Record<string, unknown>): void {
    if (this.destroyed) return;
    this.queue.push({ name, props, ts: Date.now() });
    if (this.queue.length >= this.maxBatchSize) {
      void this.flush();
    }
  }

  /** Posts whatever is currently in the queue. Resolves on best-effort. */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.queue.length);
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const token = this.authToken?.();
    if (token) headers.authorization = `Bearer ${token}`;
    try {
      const res = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
      if (!res.ok) {
        this.log('analytics_http_not_ok', { status: res.status });
        // best-effort: drop on 4xx, requeue on 5xx
        if (res.status >= 500 && this.queue.length + batch.length <= this.maxBatchSize * 4) {
          this.queue.unshift(...batch);
        }
      }
    } catch (err) {
      this.log('analytics_post_failed', err);
      // network failure: requeue with cap to prevent unbounded growth
      if (this.queue.length + batch.length <= this.maxBatchSize * 4) {
        this.queue.unshift(...batch);
      }
    }
  }

  /** Test inspection. */
  pendingCount(): number {
    return this.queue.length;
  }
}
