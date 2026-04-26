/**
 * AudioManager (ZY-09-06)
 *
 * Three independent groups: bgm / sfx / voice. Backed by Howler when in a
 * browser context — but the module is fully unit-testable via the injected
 * `howlFactory` so we don't need a real WebAudio context to verify volume,
 * fade, or unlock semantics.
 */
export type AudioGroup = 'bgm' | 'sfx' | 'voice';

export const AUDIO_GROUPS: readonly AudioGroup[] = ['bgm', 'sfx', 'voice'] as const;

export interface AudioRegistration {
  id: string;
  src: string | string[];
  group: AudioGroup;
  loop?: boolean;
  volume?: number;
}

export interface PlayOptions {
  loop?: boolean;
  /** Fade-in duration in ms (default 0). */
  fadeMs?: number;
  /** Per-call volume override (multiplied with group volume). */
  volume?: number;
}

export interface HowlLike {
  play: () => number;
  stop: () => void;
  pause: () => void;
  fade: (from: number, to: number, durationMs: number) => void;
  volume: (level?: number) => number | void;
  unload: () => void;
  loop: (loop?: boolean) => boolean | void;
}

export interface HowlConstructorOptions {
  src: string[];
  loop?: boolean;
  volume?: number;
  html5?: boolean;
}

export type HowlFactory = (opts: HowlConstructorOptions) => HowlLike;

export interface AudioManagerOptions {
  /** Inject a Howl factory. In production we lazy-import 'howler'. */
  howlFactory?: HowlFactory;
  /** Persistence callbacks for user settings (volume / mute). */
  persist?: {
    load?: () => Partial<Record<AudioGroup, number>> & { muted?: boolean };
    save?: (state: { volumes: Record<AudioGroup, number>; muted: boolean }) => void;
  };
  /** Global mute on construct. */
  muted?: boolean;
}

interface SoundRecord {
  reg: AudioRegistration;
  howl: HowlLike;
}

const DEFAULT_VOLUMES: Record<AudioGroup, number> = { bgm: 0.6, sfx: 0.8, voice: 1.0 };

export class AudioManager {
  private factoryPromise: Promise<HowlFactory> | null = null;
  private readonly factoryOverride?: HowlFactory;
  private readonly persist?: AudioManagerOptions['persist'];
  private readonly sounds = new Map<string, SoundRecord>();
  private readonly volumes: Record<AudioGroup, number>;
  private _muted: boolean;
  private _unlocked = false;

  constructor(opts: AudioManagerOptions = {}) {
    this.factoryOverride = opts.howlFactory;
    this.persist = opts.persist;
    const persisted = opts.persist?.load?.() ?? {};
    this.volumes = {
      bgm: persisted.bgm ?? DEFAULT_VOLUMES.bgm,
      sfx: persisted.sfx ?? DEFAULT_VOLUMES.sfx,
      voice: persisted.voice ?? DEFAULT_VOLUMES.voice,
    };
    this._muted = persisted.muted ?? Boolean(opts.muted);
  }

  get muted(): boolean {
    return this._muted;
  }

  get unlocked(): boolean {
    return this._unlocked;
  }

  groupVolume(group: AudioGroup): number {
    return this.volumes[group];
  }

  setVolume(group: AudioGroup, value: number): void {
    this.volumes[group] = clamp01(value);
    for (const rec of this.sounds.values()) {
      if (rec.reg.group === group) {
        rec.howl.volume(this._effectiveVolume(rec.reg));
      }
    }
    this._save();
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    for (const rec of this.sounds.values()) {
      rec.howl.volume(this._effectiveVolume(rec.reg));
    }
    this._save();
  }

  /** Call from the first user-gesture handler on iOS Safari. */
  async unlock(): Promise<void> {
    this._unlocked = true;
    // No-op: Howler unlocks automatically on the first user gesture; this flag
    // lets us short-circuit `await unlock()` in tests + UX surfaces.
  }

  async register(reg: AudioRegistration): Promise<void> {
    if (this.sounds.has(reg.id)) return;
    const factory = await this._factory();
    const howl = factory({
      src: Array.isArray(reg.src) ? reg.src : [reg.src],
      loop: reg.loop ?? false,
      volume: this._effectiveVolume(reg),
      html5: reg.group === 'bgm', // stream BGM
    });
    this.sounds.set(reg.id, { reg, howl });
  }

  async play(id: string, opts: PlayOptions = {}): Promise<number | null> {
    const rec = this.sounds.get(id);
    if (!rec) return null;
    if (typeof opts.loop === 'boolean') rec.howl.loop(opts.loop);
    if (typeof opts.volume === 'number') {
      rec.howl.volume(clamp01(opts.volume) * this.volumes[rec.reg.group] * (this._muted ? 0 : 1));
    }
    const handle = rec.howl.play();
    if (opts.fadeMs && opts.fadeMs > 0) {
      const target = this._effectiveVolume(rec.reg);
      rec.howl.volume(0);
      rec.howl.fade(0, target, Math.min(500, opts.fadeMs));
    }
    return handle;
  }

  stop(id: string): void {
    const rec = this.sounds.get(id);
    rec?.howl.stop();
  }

  pause(id: string): void {
    const rec = this.sounds.get(id);
    rec?.howl.pause();
  }

  unloadAll(): void {
    for (const rec of this.sounds.values()) {
      try {
        rec.howl.unload();
      } catch {
        /* best effort */
      }
    }
    this.sounds.clear();
  }

  private _effectiveVolume(reg: AudioRegistration): number {
    if (this._muted) return 0;
    const base = clamp01(reg.volume ?? 1);
    return base * this.volumes[reg.group];
  }

  private async _factory(): Promise<HowlFactory> {
    if (this.factoryOverride) return this.factoryOverride;
    if (!this.factoryPromise) {
      this.factoryPromise = (async () => {
        try {
          const mod = (await import('howler')) as { Howl: new (o: HowlConstructorOptions) => HowlLike };
          return (opts) => new mod.Howl(opts);
        } catch {
          // Howler not installed (e.g. server build). Return a noop factory.
          return () => createNoopHowl();
        }
      })();
    }
    return this.factoryPromise;
  }

  private _save(): void {
    this.persist?.save?.({ volumes: { ...this.volumes }, muted: this._muted });
  }
}

function createNoopHowl(): HowlLike {
  let _volume = 1;
  return {
    play: () => 0,
    stop: () => undefined,
    pause: () => undefined,
    fade: () => undefined,
    volume: (v) => {
      if (v !== undefined) _volume = v;
      return _volume;
    },
    unload: () => undefined,
    loop: () => false,
  };
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
