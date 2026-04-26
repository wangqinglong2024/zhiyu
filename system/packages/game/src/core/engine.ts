/**
 * Engine core (ZY-09-01)
 *
 * Owns the deterministic 60Hz tick + lifecycle. Rendering is delegated to a
 * pluggable renderer (see PixiRenderer) and gameplay to a SceneManager. The
 * engine itself is platform-agnostic — every external API (rAF, ResizeObserver,
 * performance.now) is injected so unit tests run inside jsdom.
 */
import { SceneManager } from '../scenes/manager.js';

export type EngineState = 'idle' | 'running' | 'paused' | 'destroyed';

export interface RafLike {
  request: (cb: (ts: number) => void) => number;
  cancel: (id: number) => void;
}

export interface EngineConfig {
  /** Logical fixed timestep in ms (default 1000/60). */
  fixedStepMs?: number;
  /** Hard cap to avoid spiral-of-death after long pauses (default 250ms). */
  maxFrameMs?: number;
  /** Optional injection points for tests / non-DOM hosts. */
  raf?: RafLike;
  now?: () => number;
}

export interface TickContext {
  /** Wall-clock delta in ms (capped). */
  dt: number;
  /** Fixed-step number of frames consumed this tick. */
  frames: number;
  /** Monotonic frame index since start. */
  frame: number;
  /** Time since start in ms. */
  elapsed: number;
}

export type TickListener = (ctx: TickContext) => void;
export type ResizeListener = (size: { width: number; height: number }) => void;

const DEFAULT_FIXED_STEP_MS = 1000 / 60;
const DEFAULT_MAX_FRAME_MS = 250;

function defaultRaf(): RafLike {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    return {
      request: (cb) => globalThis.requestAnimationFrame(cb),
      cancel: (id) => globalThis.cancelAnimationFrame(id),
    };
  }
  // Fallback for non-browser environments (and a deterministic baseline for tests).
  let id = 0;
  const handles = new Map<number, ReturnType<typeof setTimeout>>();
  return {
    request: (cb) => {
      const handle = ++id;
      const t = setTimeout(() => {
        handles.delete(handle);
        cb(Date.now());
      }, DEFAULT_FIXED_STEP_MS);
      handles.set(handle, t);
      return handle;
    },
    cancel: (handle) => {
      const t = handles.get(handle);
      if (t) {
        clearTimeout(t);
        handles.delete(handle);
      }
    },
  };
}

function defaultNow(): () => number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return () => performance.now();
  }
  return () => Date.now();
}

/**
 * The Engine class is the heart of the game runtime.
 *
 * Lifecycle: `new Engine()` → `init()` → `start()` ↔ `pause()` / `resume()` →
 * `stop()` → `destroy()`. Re-entrant calls are safe and idempotent.
 */
export class Engine {
  readonly fixedStepMs: number;
  readonly maxFrameMs: number;
  readonly scenes: SceneManager;

  private readonly raf: RafLike;
  private readonly now: () => number;
  private readonly tickListeners = new Set<TickListener>();
  private readonly resizeListeners = new Set<ResizeListener>();

  private _state: EngineState = 'idle';
  private _frame = 0;
  private _elapsed = 0;
  private _accumulator = 0;
  private _lastTs = 0;
  private _rafId: number | null = null;
  private _size = { width: 0, height: 0 };

  constructor(config: EngineConfig = {}) {
    this.fixedStepMs = config.fixedStepMs ?? DEFAULT_FIXED_STEP_MS;
    this.maxFrameMs = config.maxFrameMs ?? DEFAULT_MAX_FRAME_MS;
    this.raf = config.raf ?? defaultRaf();
    this.now = config.now ?? defaultNow();
    this.scenes = new SceneManager();
  }

  get state(): EngineState {
    return this._state;
  }

  get frame(): number {
    return this._frame;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  get size(): Readonly<{ width: number; height: number }> {
    return this._size;
  }

  init(): void {
    if (this._state !== 'idle' && this._state !== 'destroyed') return;
    this._state = 'idle';
    this._frame = 0;
    this._elapsed = 0;
    this._accumulator = 0;
  }

  start(): void {
    if (this._state === 'running' || this._state === 'destroyed') return;
    this._state = 'running';
    this._lastTs = this.now();
    this._schedule();
  }

  pause(): void {
    if (this._state !== 'running') return;
    this._state = 'paused';
    this._cancel();
  }

  resume(): void {
    if (this._state !== 'paused') return;
    this._state = 'running';
    this._lastTs = this.now();
    this._schedule();
  }

  stop(): void {
    if (this._state === 'destroyed' || this._state === 'idle') return;
    this._state = 'idle';
    this._cancel();
  }

  destroy(): void {
    this._cancel();
    this.tickListeners.clear();
    this.resizeListeners.clear();
    this.scenes.clear();
    this._state = 'destroyed';
  }

  resize(width: number, height: number): void {
    this._size = { width, height };
    for (const cb of this.resizeListeners) cb(this._size);
  }

  onTick(cb: TickListener): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  onResize(cb: ResizeListener): () => void {
    this.resizeListeners.add(cb);
    return () => this.resizeListeners.delete(cb);
  }

  /** Run a single deterministic tick. Exposed so headless tests can step. */
  step(deltaMs: number): TickContext {
    const dt = Math.max(0, Math.min(deltaMs, this.maxFrameMs));
    this._accumulator += dt;
    let frames = 0;
    while (this._accumulator >= this.fixedStepMs) {
      this._accumulator -= this.fixedStepMs;
      this._frame += 1;
      this._elapsed += this.fixedStepMs;
      frames += 1;
    }
    const ctx: TickContext = {
      dt,
      frames,
      frame: this._frame,
      elapsed: this._elapsed,
    };
    const topScene = this.scenes.top();
    if (frames > 0) {
      // Fixed-step update for active scene + listeners.
      for (let i = 0; i < frames; i += 1) {
        topScene?.update?.(this.fixedStepMs);
      }
      for (const cb of this.tickListeners) cb(ctx);
    }
    topScene?.render?.(dt);
    return ctx;
  }

  private _schedule(): void {
    if (this._state !== 'running') return;
    this._rafId = this.raf.request((ts) => this._loop(ts));
  }

  private _cancel(): void {
    if (this._rafId !== null) {
      this.raf.cancel(this._rafId);
      this._rafId = null;
    }
  }

  private _loop(_ts: number): void {
    if (this._state !== 'running') return;
    const now = this.now();
    const delta = now - this._lastTs;
    this._lastTs = now;
    this.step(delta);
    this._schedule();
  }
}

/**
 * Convenience factory mirroring the spec's `createGame(config)` API.
 * Wires up an Engine + auto-mounts (when an element is provided) the renderer.
 */
export interface GameConfig extends EngineConfig {
  /** Container element to mount the renderer into. */
  container?: HTMLElement;
  /** Auto-start after init (default true). */
  autoStart?: boolean;
}

export interface GameInstance {
  engine: Engine;
  destroy: () => void;
}

export function createGame(config: GameConfig = {}): GameInstance {
  const engine = new Engine(config);
  engine.init();
  if (config.autoStart !== false) engine.start();
  return {
    engine,
    destroy: () => engine.destroy(),
  };
}
