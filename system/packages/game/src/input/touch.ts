/**
 * TouchInput / Pointer gestures (ZY-09-05 V1)
 *
 * Recognises 5 gestures via Pointer Events: tap, drag, swipe (4-direction),
 * longpress, pinch. Multi-touch supported (≥2 simultaneous pointers). All
 * thresholds are configurable.
 *
 * The recognizer is exposed as a pure state machine to make it deterministic
 * for unit tests — call `feedPointer(...)` directly rather than dispatching
 * synthetic DOM events.
 */
export type GestureType = 'tap' | 'drag' | 'swipe' | 'longpress' | 'pinch';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface BaseGesture {
  type: GestureType;
  pointerCount: number;
  /** Time in ms when the gesture was emitted. */
  ts: number;
}

export interface TapGesture extends BaseGesture {
  type: 'tap';
  x: number;
  y: number;
}

export interface DragGesture extends BaseGesture {
  type: 'drag';
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface SwipeGesture extends BaseGesture {
  type: 'swipe';
  direction: SwipeDirection;
  velocity: number;
}

export interface LongpressGesture extends BaseGesture {
  type: 'longpress';
  x: number;
  y: number;
  durationMs: number;
}

export interface PinchGesture extends BaseGesture {
  type: 'pinch';
  scale: number;
  centerX: number;
  centerY: number;
}

export type Gesture = TapGesture | DragGesture | SwipeGesture | LongpressGesture | PinchGesture;

export interface TouchInputOptions {
  /** Minimum distance to no longer be a tap (default 10px). */
  tapMaxDistance?: number;
  /** Maximum tap duration (default 250ms). */
  tapMaxMs?: number;
  /** Longpress duration (default 600ms). */
  longpressMs?: number;
  /** Swipe minimum velocity in px/ms (default 0.4). */
  swipeMinVelocity?: number;
  /** Swipe minimum distance (default 30px). */
  swipeMinDistance?: number;
  /** Drag minimum distance to start (default 6px). */
  dragMinDistance?: number;
  /** Optional EventTarget for DOM attach. */
  target?: EventTarget | null;
  now?: () => number;
}

interface PointerState {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  startTs: number;
  moved: boolean;
  longpressTimer: ReturnType<typeof setTimeout> | null;
  longpressFired: boolean;
}

const DEFAULTS = {
  tapMaxDistance: 10,
  tapMaxMs: 250,
  longpressMs: 600,
  swipeMinVelocity: 0.4,
  swipeMinDistance: 30,
  dragMinDistance: 6,
};

export class TouchInput {
  readonly options: Required<Omit<TouchInputOptions, 'target' | 'now'>>;
  readonly target: EventTarget | null;
  readonly listeners = new Set<(g: Gesture) => void>();

  private readonly pointers = new Map<number, PointerState>();
  private readonly now: () => number;
  private _attached = false;
  private _initialPinchDistance = 0;

  private readonly _onPointerDown = (e: Event) => this._fromDom(e as PointerEvent, 'down');
  private readonly _onPointerMove = (e: Event) => this._fromDom(e as PointerEvent, 'move');
  private readonly _onPointerUp = (e: Event) => this._fromDom(e as PointerEvent, 'up');
  private readonly _onPointerCancel = (e: Event) => this._fromDom(e as PointerEvent, 'cancel');

  constructor(opts: TouchInputOptions = {}) {
    this.options = {
      tapMaxDistance: opts.tapMaxDistance ?? DEFAULTS.tapMaxDistance,
      tapMaxMs: opts.tapMaxMs ?? DEFAULTS.tapMaxMs,
      longpressMs: opts.longpressMs ?? DEFAULTS.longpressMs,
      swipeMinVelocity: opts.swipeMinVelocity ?? DEFAULTS.swipeMinVelocity,
      swipeMinDistance: opts.swipeMinDistance ?? DEFAULTS.swipeMinDistance,
      dragMinDistance: opts.dragMinDistance ?? DEFAULTS.dragMinDistance,
    };
    this.target = opts.target ?? (typeof window !== 'undefined' ? window : null);
    this.now = opts.now ?? (() => Date.now());
  }

  attach(): void {
    if (this._attached || !this.target) return;
    this.target.addEventListener('pointerdown', this._onPointerDown);
    this.target.addEventListener('pointermove', this._onPointerMove);
    this.target.addEventListener('pointerup', this._onPointerUp);
    this.target.addEventListener('pointercancel', this._onPointerCancel);
    this._attached = true;
  }

  detach(): void {
    if (!this._attached || !this.target) return;
    this.target.removeEventListener('pointerdown', this._onPointerDown);
    this.target.removeEventListener('pointermove', this._onPointerMove);
    this.target.removeEventListener('pointerup', this._onPointerUp);
    this.target.removeEventListener('pointercancel', this._onPointerCancel);
    this._attached = false;
    this._cancelAll();
  }

  onGesture(cb: (g: Gesture) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Programmatic input for unit tests. */
  feedPointer(opts: { id: number; x: number; y: number; phase: 'down' | 'move' | 'up' | 'cancel' }): void {
    const ts = this.now();
    if (opts.phase === 'down') {
      const ps: PointerState = {
        id: opts.id,
        startX: opts.x,
        startY: opts.y,
        x: opts.x,
        y: opts.y,
        startTs: ts,
        moved: false,
        longpressTimer: null,
        longpressFired: false,
      };
      ps.longpressTimer = setTimeout(() => this._maybeLongpress(opts.id), this.options.longpressMs);
      this.pointers.set(opts.id, ps);
      if (this.pointers.size === 2) {
        this._initialPinchDistance = this._currentPinchDistance() || 1;
      }
      return;
    }
    const p = this.pointers.get(opts.id);
    if (!p) return;
    if (opts.phase === 'move') {
      p.x = opts.x;
      p.y = opts.y;
      const distance = Math.hypot(p.x - p.startX, p.y - p.startY);
      if (distance > this.options.dragMinDistance) {
        if (!p.moved) {
          p.moved = true;
          this._clearLongpress(p);
        }
        this._emit({
          type: 'drag',
          pointerCount: this.pointers.size,
          ts,
          x: p.x,
          y: p.y,
          dx: p.x - p.startX,
          dy: p.y - p.startY,
        });
      }
      if (this.pointers.size >= 2 && this._initialPinchDistance > 0) {
        const cur = this._currentPinchDistance();
        const scale = cur / this._initialPinchDistance;
        const center = this._currentPinchCenter();
        this._emit({
          type: 'pinch',
          pointerCount: this.pointers.size,
          ts,
          scale,
          centerX: center.x,
          centerY: center.y,
        });
      }
      return;
    }
    // up / cancel
    this._clearLongpress(p);
    const dt = Math.max(1, ts - p.startTs);
    const dx = p.x - p.startX;
    const dy = p.y - p.startY;
    const distance = Math.hypot(dx, dy);
    if (opts.phase === 'up' && !p.longpressFired) {
      if (distance <= this.options.tapMaxDistance && dt <= this.options.tapMaxMs) {
        this._emit({ type: 'tap', pointerCount: this.pointers.size, ts, x: p.x, y: p.y });
      } else {
        const velocity = distance / dt;
        if (velocity >= this.options.swipeMinVelocity && distance >= this.options.swipeMinDistance) {
          this._emit({
            type: 'swipe',
            pointerCount: this.pointers.size,
            ts,
            direction: this._direction(dx, dy),
            velocity,
          });
        }
      }
    }
    this.pointers.delete(opts.id);
    if (this.pointers.size < 2) this._initialPinchDistance = 0;
  }

  private _fromDom(e: PointerEvent, phase: 'down' | 'move' | 'up' | 'cancel'): void {
    this.feedPointer({ id: e.pointerId, x: e.clientX, y: e.clientY, phase });
  }

  private _maybeLongpress(id: number): void {
    const p = this.pointers.get(id);
    if (!p || p.moved) return;
    p.longpressFired = true;
    this._emit({
      type: 'longpress',
      pointerCount: this.pointers.size,
      ts: this.now(),
      x: p.x,
      y: p.y,
      durationMs: this.options.longpressMs,
    });
  }

  private _currentPinchDistance(): number {
    const ps = [...this.pointers.values()];
    if (ps.length < 2) return 0;
    const a = ps[0]!;
    const b = ps[1]!;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private _currentPinchCenter(): { x: number; y: number } {
    const ps = [...this.pointers.values()];
    if (ps.length < 2) return { x: 0, y: 0 };
    const a = ps[0]!;
    const b = ps[1]!;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  private _direction(dx: number, dy: number): SwipeDirection {
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  private _clearLongpress(p: PointerState): void {
    if (p.longpressTimer) {
      clearTimeout(p.longpressTimer);
      p.longpressTimer = null;
    }
  }

  private _cancelAll(): void {
    for (const p of this.pointers.values()) this._clearLongpress(p);
    this.pointers.clear();
    this._initialPinchDistance = 0;
  }

  private _emit(g: Gesture): void {
    for (const cb of this.listeners) cb(g);
  }
}

/** Auto-pick KeyboardInput vs TouchInput based on UA / pointer type. */
export function detectPrimaryInput(): 'keyboard' | 'touch' {
  if (typeof window === 'undefined') return 'keyboard';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse ? 'touch' : 'keyboard';
}
