/**
 * SceneManager (ZY-09-03)
 *
 * A thin push/pop/replace stack with async transitions (≤200ms fade by
 * default). Transitions are non-blocking from the caller's perspective:
 * `replace()` returns a Promise that resolves once the new scene's `enter`
 * lifecycle finishes.
 */
import type { Scene } from './scene.js';

export interface TransitionOptions {
  /** Total transition duration in ms (default 200). */
  durationMs?: number;
  /** Hook fired with progress 0→1; useful for fade overlays. */
  onProgress?: (t: number) => void;
}

const DEFAULT_TRANSITION_MS = 200;

export class SceneManager {
  private readonly stack: Scene[] = [];
  private _transitioning = false;

  get isTransitioning(): boolean {
    return this._transitioning;
  }

  size(): number {
    return this.stack.length;
  }

  top(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  /** All scenes from bottom→top. Read only. */
  snapshot(): readonly Scene[] {
    return [...this.stack];
  }

  async push(scene: Scene, params?: Record<string, unknown>, opts?: TransitionOptions): Promise<void> {
    await this._guard(async () => {
      await this._transition(opts);
      this.stack.push(scene);
      await scene.enter?.(params);
    });
  }

  async pop(opts?: TransitionOptions): Promise<Scene | undefined> {
    let popped: Scene | undefined;
    await this._guard(async () => {
      await this._transition(opts);
      popped = this.stack.pop();
      await popped?.exit?.();
    });
    return popped;
  }

  async replace(scene: Scene, params?: Record<string, unknown>, opts?: TransitionOptions): Promise<void> {
    await this._guard(async () => {
      await this._transition(opts);
      const prev = this.stack.pop();
      await prev?.exit?.();
      this.stack.push(scene);
      await scene.enter?.(params);
    });
  }

  /** Pop everything. Used during engine teardown. */
  clear(): void {
    while (this.stack.length > 0) {
      const s = this.stack.pop();
      try {
        s?.exit?.();
      } catch {
        /* ignore */
      }
    }
  }

  private async _guard<T>(fn: () => Promise<T>): Promise<T> {
    if (this._transitioning) {
      // Serialize via micro-queue to maintain enter/exit order.
      await Promise.resolve();
    }
    this._transitioning = true;
    try {
      return await fn();
    } finally {
      this._transitioning = false;
    }
  }

  private async _transition(opts?: TransitionOptions): Promise<void> {
    const duration = opts?.durationMs ?? DEFAULT_TRANSITION_MS;
    if (duration <= 0 || !opts?.onProgress) return;
    const start = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        const t = Math.min(1, (Date.now() - start) / duration);
        opts.onProgress?.(t);
        if (t >= 1) resolve();
        else if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tick);
        else setTimeout(tick, 16);
      };
      tick();
    });
  }
}
