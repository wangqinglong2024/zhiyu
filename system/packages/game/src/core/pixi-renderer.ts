/**
 * PixiRenderer (ZY-09-02)
 *
 * Wraps a `pixi.js` Application with sane defaults: DPR clamp, low-end
 * detection (deviceMemory / hardwareConcurrency) → 1x + antialias off,
 * ResizeObserver-driven container resize, WebGL → canvas2d fallback.
 *
 * Pixi is loaded lazily so the package can be imported in test environments
 * without a WebGL context. All Pixi types are intentionally `unknown` typed
 * via a small structural interface — keeps unit tests Pixi-free.
 */
import type { Engine } from './engine.js';

export interface PixiRendererOptions {
  /** Override max device pixel ratio (default 2). */
  maxResolution?: number;
  /** Force a fallback path (test hook). */
  forceLowEnd?: boolean;
  /** Force WebGL to fail (test hook). */
  forceCanvas?: boolean;
  /** Background color (default black). */
  background?: number;
  /** Optional injected Pixi module — primarily for tests. */
  pixi?: PixiModuleLike;
}

export interface PixiModuleLike {
  Application: new () => PixiApplicationLike;
}

export interface PixiApplicationLike {
  canvas: HTMLCanvasElement | null;
  init: (opts: Record<string, unknown>) => Promise<void>;
  destroy: (removeView?: boolean, opts?: { children: boolean }) => void;
  renderer: { resize: (w: number, h: number) => void } | null;
  ticker: { add: (fn: (t: number) => void) => void; remove: (fn: (t: number) => void) => void };
  stage: unknown;
}

export interface DeviceProfile {
  lowEnd: boolean;
  resolution: number;
  antialias: boolean;
  preference: 'webgl' | 'canvas';
}

export function detectDeviceProfile(opts: {
  maxResolution?: number;
  forceLowEnd?: boolean;
  forceCanvas?: boolean;
} = {}): DeviceProfile {
  const nav = (typeof navigator !== 'undefined' ? navigator : null) as
    | (Navigator & { deviceMemory?: number })
    | null;
  const memory = nav?.deviceMemory ?? 8;
  const cores = nav?.hardwareConcurrency ?? 8;
  const lowEnd = Boolean(opts.forceLowEnd) || memory < 4 || cores < 4;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cap = opts.maxResolution ?? 2;
  const resolution = lowEnd ? 1 : Math.min(dpr, cap);
  const antialias = !lowEnd;
  const preference: 'webgl' | 'canvas' = opts.forceCanvas ? 'canvas' : 'webgl';
  return { lowEnd, resolution, antialias, preference };
}

/**
 * Compute the inner letterbox layout for a logical resolution rendered into a
 * container of arbitrary aspect ratio. Returned `scale` keeps both axes in
 * sync (uniform), `offsetX/Y` is the centring shift in container pixels.
 */
export function letterbox(
  containerW: number,
  containerH: number,
  logicalW: number,
  logicalH: number,
): { scale: number; offsetX: number; offsetY: number; width: number; height: number } {
  const containerAspect = containerW / Math.max(1, containerH);
  const logicalAspect = logicalW / Math.max(1, logicalH);
  let scale: number;
  if (containerAspect > logicalAspect) {
    scale = containerH / logicalH;
  } else {
    scale = containerW / logicalW;
  }
  const width = logicalW * scale;
  const height = logicalH * scale;
  return {
    scale,
    width,
    height,
    offsetX: (containerW - width) / 2,
    offsetY: (containerH - height) / 2,
  };
}

export class PixiRenderer {
  readonly engine: Engine;
  readonly opts: Required<Omit<PixiRendererOptions, 'pixi'>> & { pixi?: PixiModuleLike };
  readonly profile: DeviceProfile;

  private _app: PixiApplicationLike | null = null;
  private _container: HTMLElement | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _unsubscribeTick: (() => void) | null = null;
  private _logicalW = 1280;
  private _logicalH = 720;

  constructor(engine: Engine, options: PixiRendererOptions = {}) {
    this.engine = engine;
    this.opts = {
      maxResolution: options.maxResolution ?? 2,
      forceLowEnd: options.forceLowEnd ?? false,
      forceCanvas: options.forceCanvas ?? false,
      background: options.background ?? 0x000000,
      pixi: options.pixi,
    };
    this.profile = detectDeviceProfile({
      maxResolution: this.opts.maxResolution,
      forceLowEnd: this.opts.forceLowEnd,
      forceCanvas: this.opts.forceCanvas,
    });
  }

  get app(): PixiApplicationLike | null {
    return this._app;
  }

  get container(): HTMLElement | null {
    return this._container;
  }

  /**
   * Mount into a DOM element. Lazily resolves `pixi.js` so the function works
   * even if the consumer hasn't set up a real WebGL context (tests stub out
   * `opts.pixi`).
   */
  async mount(el: HTMLElement, logicalSize: { width: number; height: number } = { width: 1280, height: 720 }): Promise<void> {
    this._container = el;
    this._logicalW = logicalSize.width;
    this._logicalH = logicalSize.height;
    const pixi = this.opts.pixi ?? (await this._loadPixi());
    const app = new pixi.Application();
    let initOk = true;
    try {
      await app.init({
        background: this.opts.background,
        resolution: this.profile.resolution,
        antialias: this.profile.antialias,
        autoDensity: true,
        preference: this.profile.preference,
        width: el.clientWidth || logicalSize.width,
        height: el.clientHeight || logicalSize.height,
      });
    } catch {
      initOk = false;
    }
    if (!initOk && this.profile.preference === 'webgl') {
      // Retry on canvas fallback.
      await app.init({
        background: this.opts.background,
        resolution: 1,
        antialias: false,
        autoDensity: true,
        preference: 'canvas',
        width: el.clientWidth || logicalSize.width,
        height: el.clientHeight || logicalSize.height,
      });
    }
    this._app = app;
    if (app.canvas) {
      el.appendChild(app.canvas);
    }
    this._installResizeObserver(el);
    this._installEngineTickBridge();
    this.resize();
  }

  unmount(): void {
    if (this._unsubscribeTick) {
      this._unsubscribeTick();
      this._unsubscribeTick = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._app) {
      try {
        this._app.destroy(true, { children: true });
      } catch {
        // best effort during unmount
      }
      this._app = null;
    }
    this._container = null;
  }

  resize(width?: number, height?: number): void {
    if (!this._container || !this._app?.renderer) return;
    const w = width ?? this._container.clientWidth ?? this._logicalW;
    const h = height ?? this._container.clientHeight ?? this._logicalH;
    this._app.renderer.resize(w, h);
    this.engine.resize(w, h);
  }

  private _installResizeObserver(el: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') return;
    this._resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      this.resize(width, height);
    });
    this._resizeObserver.observe(el);
  }

  private _installEngineTickBridge(): void {
    if (!this._app) return;
    // Engine drives the simulation; Pixi's own ticker only handles draw.
    // Forward Engine ticks into stage render via app.render() where available.
    this._unsubscribeTick = this.engine.onTick(() => {
      // Pixi v8: app.render() is implicit via ticker; we just tick the ticker.
      // To stay framework-pure we don't call into private fields. The default
      // Pixi ticker is left running; engine.onTick is our gameplay heartbeat.
    });
  }

  private async _loadPixi(): Promise<PixiModuleLike> {
    // Dynamic import keeps Pixi optional in non-rendering contexts.
    const mod = (await import('pixi.js')) as unknown as PixiModuleLike;
    return mod;
  }
}
