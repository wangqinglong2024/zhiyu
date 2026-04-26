/**
 * KeyboardInput (ZY-09-05 MVP)
 *
 * Frame-coherent key state: `isDown / wasJustDown / wasJustUp` are stable
 * within a single sampled frame. Call `sample()` once per Engine.tick (the
 * adapter wires this for you when Engine is provided).
 *
 * Default action map covers `up/down/left/right/action/cancel/pause`. The
 * mapping is fully overridable.
 */
import type { Engine } from '../core/engine.js';

export type ActionName =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'action'
  | 'cancel'
  | 'pause'
  | string; // allow custom

export interface KeyBinding {
  /** KeyboardEvent.code list this action listens for. */
  codes: string[];
}

export type KeyBindingMap = Record<ActionName, KeyBinding>;

export const DEFAULT_KEY_BINDINGS: KeyBindingMap = {
  up: { codes: ['ArrowUp', 'KeyW'] },
  down: { codes: ['ArrowDown', 'KeyS'] },
  left: { codes: ['ArrowLeft', 'KeyA'] },
  right: { codes: ['ArrowRight', 'KeyD'] },
  action: { codes: ['Space', 'Enter'] },
  cancel: { codes: ['Escape'] },
  pause: { codes: ['KeyP'] },
};

export interface KeyboardInputOptions {
  bindings?: Partial<KeyBindingMap>;
  /** Optional EventTarget — defaults to `window`. */
  target?: EventTarget | null;
  /** Optional Engine — when provided we hook `sample()` into onTick. */
  engine?: Engine;
}

export class KeyboardInput {
  private readonly target: EventTarget | null;
  private readonly bindings: KeyBindingMap;
  /** Live raw state (updated by event handlers). */
  private readonly live = new Set<string>();
  /** Frame-coherent snapshot taken in `sample()`. */
  private readonly current = new Set<string>();
  private readonly previous = new Set<string>();
  private _attached = false;
  private _unsubscribeEngine: (() => void) | null = null;

  private readonly _onKeyDown = (e: Event) => this._onKey(e as KeyboardEvent, true);
  private readonly _onKeyUp = (e: Event) => this._onKey(e as KeyboardEvent, false);
  private readonly _onBlur = () => this._releaseAll();

  constructor(opts: KeyboardInputOptions = {}) {
    this.target = opts.target ?? (typeof window !== 'undefined' ? window : null);
    this.bindings = { ...DEFAULT_KEY_BINDINGS, ...(opts.bindings ?? {}) } as KeyBindingMap;
    if (opts.engine) this.attachEngine(opts.engine);
  }

  attach(): void {
    if (this._attached || !this.target) return;
    this.target.addEventListener('keydown', this._onKeyDown);
    this.target.addEventListener('keyup', this._onKeyUp);
    this.target.addEventListener('blur', this._onBlur);
    this._attached = true;
  }

  detach(): void {
    if (!this._attached || !this.target) return;
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('blur', this._onBlur);
    this._attached = false;
    this._releaseAll();
    if (this._unsubscribeEngine) {
      this._unsubscribeEngine();
      this._unsubscribeEngine = null;
    }
  }

  attachEngine(engine: Engine): void {
    this.attach();
    this._unsubscribeEngine = engine.onTick(() => this.sample());
  }

  /** Take a frame snapshot. Public for headless testing. */
  sample(): void {
    this.previous.clear();
    for (const c of this.current) this.previous.add(c);
    this.current.clear();
    for (const c of this.live) this.current.add(c);
  }

  isDown(action: ActionName): boolean {
    const codes = this.bindings[action]?.codes ?? [];
    return codes.some((c) => this.current.has(c));
  }

  wasJustDown(action: ActionName): boolean {
    const codes = this.bindings[action]?.codes ?? [];
    return codes.some((c) => this.current.has(c) && !this.previous.has(c));
  }

  wasJustUp(action: ActionName): boolean {
    const codes = this.bindings[action]?.codes ?? [];
    return codes.some((c) => !this.current.has(c) && this.previous.has(c));
  }

  /** Test helper. Programmatically inject events. */
  feed(code: string, down: boolean): void {
    if (down) this.live.add(code);
    else this.live.delete(code);
  }

  private _onKey(e: KeyboardEvent, down: boolean): void {
    if (down) this.live.add(e.code);
    else this.live.delete(e.code);
  }

  private _releaseAll(): void {
    this.live.clear();
    this.current.clear();
    this.previous.clear();
  }
}
