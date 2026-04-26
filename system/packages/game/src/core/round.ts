/**
 * Round (60s default) — provides the unified countdown + "再玩一局" state
 * machine for every MVP game in E10. Spec: epic 09 §scope.
 */
import type { Engine, TickListener } from './engine.js';

export type RoundState = 'idle' | 'running' | 'ended';

export interface RoundConfig {
  durationMs?: number;
  onTick?: (remainingMs: number) => void;
  onEnd?: (summary: RoundSummary) => void;
}

export interface RoundSummary {
  durationMs: number;
  consumedMs: number;
  endedAt: number;
}

const DEFAULT_DURATION_MS = 60_000;

export class Round {
  readonly engine: Engine;
  readonly durationMs: number;

  private _state: RoundState = 'idle';
  private _remaining: number;
  private _consumed = 0;
  private _unsubscribe: (() => void) | null = null;
  private _onTick?: (remainingMs: number) => void;
  private _onEnd?: (summary: RoundSummary) => void;

  constructor(engine: Engine, config: RoundConfig = {}) {
    this.engine = engine;
    this.durationMs = config.durationMs ?? DEFAULT_DURATION_MS;
    this._remaining = this.durationMs;
    this._onTick = config.onTick;
    this._onEnd = config.onEnd;
  }

  get state(): RoundState {
    return this._state;
  }

  get remainingMs(): number {
    return this._remaining;
  }

  get consumedMs(): number {
    return this._consumed;
  }

  start(): void {
    if (this._state === 'running') return;
    this._state = 'running';
    this._remaining = this.durationMs;
    this._consumed = 0;
    const handler: TickListener = (ctx) => this._onTickInternal(ctx.dt);
    this._unsubscribe = this.engine.onTick(handler);
  }

  /** Restart for "再玩一局". Idempotent. */
  restart(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (this._state === 'running') {
      this._state = 'ended';
    }
  }

  private _onTickInternal(dtMs: number): void {
    if (this._state !== 'running') return;
    this._remaining = Math.max(0, this._remaining - dtMs);
    this._consumed = Math.min(this.durationMs, this._consumed + dtMs);
    this._onTick?.(this._remaining);
    if (this._remaining <= 0) {
      this._state = 'ended';
      this._onEnd?.({
        durationMs: this.durationMs,
        consumedMs: this._consumed,
        endedAt: Date.now(),
      });
      this.stop();
    }
  }
}
