/**
 * Unit tests covering the core ZY-09 stories. Runs in jsdom via vitest.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Engine, createGame } from '../core/engine.js';
import { Round } from '../core/round.js';
import { detectDeviceProfile, letterbox, PixiRenderer } from '../core/pixi-renderer.js';
import { BaseScene, SceneManager } from '../scenes/index.js';
import { AssetLoader } from '../assets/index.js';
import { KeyboardInput, TouchInput, PinyinKeyboardController } from '../input/index.js';
import { AudioManager, type HowlLike } from '../audio/index.js';
import { layoutHanziWithPinyin, parsePinyin, TONE_COLORS } from '../wordpack/index.js';
import { GameAnalytics } from '../analytics/index.js';
import { formatCountdown } from '../ui/index.js';
import { isFullscreen, isPortrait } from '../fullscreen/index.js';

function makeRaf() {
  const handles = new Map<number, () => void>();
  let id = 0;
  return {
    raf: {
      request: (cb: (ts: number) => void) => {
        const h = ++id;
        handles.set(h, () => cb(performance.now()));
        return h;
      },
      cancel: (h: number) => {
        handles.delete(h);
      },
    },
    flush() {
      const all = [...handles.values()];
      handles.clear();
      for (const fn of all) fn();
    },
  };
}

describe('Engine (ZY-09-01)', () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
  });

  it('runs deterministic fixed-step ticks', () => {
    const engine = new Engine({ fixedStepMs: 10, now: () => now });
    let frames = 0;
    engine.onTick(({ frames: f }) => {
      frames += f;
    });
    engine.step(35); // 3 fixed steps consumed, remainder buffered
    expect(frames).toBe(3);
    engine.step(5); // total 40 → +1
    expect(frames).toBe(4);
  });

  it('lifecycle transitions are idempotent', () => {
    const engine = new Engine({ fixedStepMs: 16 });
    engine.init();
    expect(engine.state).toBe('idle');
    engine.start();
    engine.start();
    expect(engine.state).toBe('running');
    engine.pause();
    engine.pause();
    expect(engine.state).toBe('paused');
    engine.resume();
    expect(engine.state).toBe('running');
    engine.stop();
    expect(engine.state).toBe('idle');
    engine.destroy();
    expect(engine.state).toBe('destroyed');
  });

  it('createGame factory wires up an engine', () => {
    const game = createGame({ fixedStepMs: 16, autoStart: false });
    expect(game.engine.state).toBe('idle');
    game.destroy();
    expect(game.engine.state).toBe('destroyed');
  });

  it('schedules via raf when started', () => {
    const r = makeRaf();
    const engine = new Engine({ fixedStepMs: 16, raf: r.raf, now: () => now });
    engine.start();
    now += 16;
    r.flush();
    expect(engine.frame).toBeGreaterThan(0);
    engine.destroy();
  });
});

describe('Round 60s state machine', () => {
  it('emits countdown ticks and ends after duration', () => {
    const engine = new Engine({ fixedStepMs: 100 });
    let lastRemaining = -1;
    let endedSummary: { durationMs: number } | null = null;
    const round = new Round(engine, {
      durationMs: 1_000,
      onTick: (r) => {
        lastRemaining = r;
      },
      onEnd: (s) => {
        endedSummary = s as { durationMs: number };
      },
    });
    round.start();
    for (let i = 0; i < 12; i += 1) {
      engine.step(100);
    }
    expect(round.state).toBe('ended');
    expect(lastRemaining).toBe(0);
    expect(endedSummary).not.toBeNull();
    expect((endedSummary as unknown as { durationMs: number }).durationMs).toBe(1000);
  });

  it('restart resets the timer', () => {
    const engine = new Engine({ fixedStepMs: 100 });
    const round = new Round(engine, { durationMs: 500 });
    round.start();
    engine.step(100);
    round.restart();
    expect(round.remainingMs).toBe(500);
  });
});

describe('PixiRenderer helpers (ZY-09-02)', () => {
  it('detects high-end profile by default', () => {
    const profile = detectDeviceProfile();
    expect(profile.preference).toBe('webgl');
    expect(profile.resolution).toBeGreaterThanOrEqual(1);
  });

  it('downgrades to 1x + canvas with forceLowEnd', () => {
    const profile = detectDeviceProfile({ forceLowEnd: true, forceCanvas: true });
    expect(profile.lowEnd).toBe(true);
    expect(profile.resolution).toBe(1);
    expect(profile.antialias).toBe(false);
    expect(profile.preference).toBe('canvas');
  });

  it('letterbox keeps aspect ratio uniform', () => {
    const r = letterbox(2000, 1000, 1280, 720);
    expect(Math.abs(r.scale - 1000 / 720)).toBeLessThan(0.01);
    expect(r.offsetY).toBe(0);
    expect(r.offsetX).toBeGreaterThan(0);
  });

  it('mount + unmount via injected pixi shim', async () => {
    const calls: string[] = [];
    const fakeApp = {
      canvas: document.createElement('canvas'),
      init: vi.fn(async () => {
        calls.push('init');
      }),
      destroy: vi.fn(() => calls.push('destroy')),
      renderer: { resize: () => undefined },
      ticker: { add: () => undefined, remove: () => undefined },
      stage: {},
    };
    const fakePixi = { Application: function () { return fakeApp; } as unknown as new () => typeof fakeApp };
    const engine = new Engine();
    const renderer = new PixiRenderer(engine, { pixi: fakePixi as never });
    const el = document.createElement('div');
    document.body.appendChild(el);
    await renderer.mount(el);
    expect(calls).toContain('init');
    expect(el.querySelector('canvas')).not.toBeNull();
    renderer.unmount();
    expect(calls).toContain('destroy');
    el.remove();
  });
});

describe('SceneManager (ZY-09-03)', () => {
  it('runs enter/exit lifecycle in order', async () => {
    const log: string[] = [];
    class TestScene extends BaseScene {
      readonly name: string;
      constructor(name: string) {
        super();
        this.name = name;
      }
      override enter() {
        log.push(`enter:${this.name}`);
      }
      override exit() {
        log.push(`exit:${this.name}`);
      }
    }
    const mgr = new SceneManager();
    await mgr.push(new TestScene('loading'));
    await mgr.replace(new TestScene('game'));
    await mgr.replace(new TestScene('gameover'));
    expect(log).toEqual([
      'enter:loading',
      'exit:loading',
      'enter:game',
      'exit:game',
      'enter:gameover',
    ]);
    expect(mgr.size()).toBe(1);
    expect(mgr.top()?.name).toBe('gameover');
  });

  it('clear pops all', () => {
    const mgr = new SceneManager();
    mgr.push({ name: 'a' });
    mgr.push({ name: 'b' });
    mgr.clear();
    expect(mgr.size()).toBe(0);
  });
});

describe('AssetLoader (ZY-09-04)', () => {
  it('reports monotonic progress and aggregates errors', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/bad.json')) return new Response('nope', { status: 500 });
      return new Response(JSON.stringify({ ok: true, url }), {
        headers: { 'content-type': 'application/json' },
      });
    });
    const loader = new AssetLoader({ fetcher: fetcher as unknown as typeof fetch });
    const events: number[] = [];
    const result = await loader.preload(
      {
        json: [
          { id: 'a', url: '/a.json' },
          { id: 'b', url: '/bad.json', retries: 0 },
          { id: 'c', url: '/c.json' },
        ],
      },
      (e) => events.push(Number(e.ratio.toFixed(2))),
    );
    expect(result.assets.size).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.id).toBe('b');
    expect(events.at(-1)).toBe(1);
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i]).toBeGreaterThanOrEqual(events[i - 1] ?? 0);
    }
  });

  it('caches by id', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ a: 1 }), {
      headers: { 'content-type': 'application/json' },
    }));
    const loader = new AssetLoader({ fetcher: fetcher as unknown as typeof fetch });
    await loader.preload({ json: [{ id: 'x', url: '/x.json' }] });
    await loader.preload({ json: [{ id: 'x', url: '/x.json' }] });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(loader.has('x')).toBe(true);
  });
});

describe('KeyboardInput (ZY-09-05 MVP)', () => {
  it('isDown / wasJustDown / wasJustUp transitions', () => {
    const kb = new KeyboardInput({ target: null });
    kb.feed('Space', true);
    kb.sample(); // current = {Space}, prev = {}
    expect(kb.isDown('action')).toBe(true);
    expect(kb.wasJustDown('action')).toBe(true);
    expect(kb.wasJustUp('action')).toBe(false);
    kb.sample(); // current = {Space}, prev = {Space}
    expect(kb.wasJustDown('action')).toBe(false);
    kb.feed('Space', false);
    kb.sample();
    expect(kb.isDown('action')).toBe(false);
    expect(kb.wasJustUp('action')).toBe(true);
  });

  it('blur releases all keys', () => {
    const kb = new KeyboardInput({ target: window });
    kb.attach();
    kb.feed('KeyW', true);
    window.dispatchEvent(new Event('blur'));
    kb.sample();
    expect(kb.isDown('up')).toBe(false);
    kb.detach();
  });
});

describe('TouchInput (ZY-09-05 V1)', () => {
  let now = 1000;
  const advance = (ms: number) => {
    now += ms;
  };
  beforeEach(() => {
    now = 1000;
  });

  it('recognises tap', () => {
    const ti = new TouchInput({ target: null, now: () => now });
    const events: string[] = [];
    ti.onGesture((g) => events.push(g.type));
    ti.feedPointer({ id: 1, x: 100, y: 100, phase: 'down' });
    advance(80);
    ti.feedPointer({ id: 1, x: 102, y: 101, phase: 'up' });
    expect(events).toContain('tap');
  });

  it('recognises swipe', () => {
    const ti = new TouchInput({ target: null, now: () => now });
    const swipes: string[] = [];
    ti.onGesture((g) => g.type === 'swipe' && swipes.push(g.direction));
    ti.feedPointer({ id: 2, x: 100, y: 100, phase: 'down' });
    advance(80);
    ti.feedPointer({ id: 2, x: 200, y: 100, phase: 'move' });
    ti.feedPointer({ id: 2, x: 200, y: 100, phase: 'up' });
    expect(swipes).toEqual(['right']);
  });

  it('recognises pinch', () => {
    const ti = new TouchInput({ target: null, now: () => now });
    const scales: number[] = [];
    ti.onGesture((g) => g.type === 'pinch' && scales.push(g.scale));
    ti.feedPointer({ id: 1, x: 100, y: 200, phase: 'down' });
    ti.feedPointer({ id: 2, x: 200, y: 200, phase: 'down' });
    ti.feedPointer({ id: 1, x: 80, y: 200, phase: 'move' });
    ti.feedPointer({ id: 2, x: 220, y: 200, phase: 'move' });
    expect(scales.at(-1)).toBeGreaterThan(1);
  });

  it('recognises longpress', () => {
    vi.useFakeTimers();
    try {
      const ti = new TouchInput({ target: null, now: () => Date.now(), longpressMs: 200 });
      const seen: string[] = [];
      ti.onGesture((g) => seen.push(g.type));
      ti.feedPointer({ id: 9, x: 50, y: 50, phase: 'down' });
      vi.advanceTimersByTime(250);
      ti.feedPointer({ id: 9, x: 50, y: 50, phase: 'up' });
      expect(seen).toContain('longpress');
    } finally {
      vi.useRealTimers();
    }
  });

  it('recognises drag', () => {
    const ti = new TouchInput({ target: null, now: () => now });
    const drags: number[] = [];
    ti.onGesture((g) => g.type === 'drag' && drags.push(g.dx));
    ti.feedPointer({ id: 7, x: 0, y: 0, phase: 'down' });
    ti.feedPointer({ id: 7, x: 30, y: 0, phase: 'move' });
    ti.feedPointer({ id: 7, x: 30, y: 0, phase: 'up' });
    expect(drags.at(-1)).toBe(30);
  });
});

describe('PinyinKeyboardController', () => {
  it('composes & submits a syllable', () => {
    const ctrl = new PinyinKeyboardController();
    const inputs: string[] = [];
    const submits: string[] = [];
    ctrl.onInput((v) => inputs.push(v));
    ctrl.onSubmit((v) => submits.push(v));
    ctrl.press({ glyph: 'm', token: 'm', group: 'initial' });
    ctrl.press({ glyph: 'a', token: 'a', group: 'final' });
    ctrl.press({ glyph: '¯', token: '1', group: 'tone' });
    expect(ctrl.value).toBe('ma1');
    ctrl.press({ glyph: '⏎', token: 'enter', group: 'control' });
    expect(submits).toEqual(['ma1']);
    expect(ctrl.value).toBe('');
    expect(inputs.at(-1)).toBe('');
  });
});

describe('AudioManager (ZY-09-06)', () => {
  function fakeFactory(): { factory: () => HowlLike; calls: string[]; volumes: number[] } {
    const calls: string[] = [];
    const volumes: number[] = [];
    let _vol = 1;
    return {
      calls,
      volumes,
      factory: () => ({
        play: () => {
          calls.push('play');
          return 1;
        },
        stop: () => calls.push('stop'),
        pause: () => calls.push('pause'),
        fade: (from, to, dur) => calls.push(`fade:${from}:${to}:${dur}`),
        volume: (v?: number) => {
          if (v !== undefined) {
            _vol = v;
            volumes.push(v);
          }
          return _vol;
        },
        unload: () => calls.push('unload'),
        loop: () => false,
      }),
    };
  }

  it('uses independent group volumes', async () => {
    const f = fakeFactory();
    const am = new AudioManager({ howlFactory: () => f.factory() });
    await am.register({ id: 'theme', src: '/theme.mp3', group: 'bgm' });
    am.setVolume('bgm', 0.3);
    expect(f.volumes.at(-1)).toBeCloseTo(0.3, 4);
    am.setVolume('sfx', 0.9);
    expect(am.groupVolume('sfx')).toBe(0.9);
    expect(am.groupVolume('bgm')).toBe(0.3);
  });

  it('mute zeroes volume but does not change group level', async () => {
    const f = fakeFactory();
    const am = new AudioManager({ howlFactory: () => f.factory() });
    await am.register({ id: 'a', src: '/a.mp3', group: 'sfx' });
    am.setMuted(true);
    expect(f.volumes.at(-1)).toBe(0);
    expect(am.groupVolume('sfx')).toBe(0.8);
    am.setMuted(false);
    expect(f.volumes.at(-1)).toBeCloseTo(0.8, 4);
  });

  it('fade-in caps at 500ms', async () => {
    const f = fakeFactory();
    const am = new AudioManager({ howlFactory: () => f.factory() });
    await am.register({ id: 'bgm', src: '/b.mp3', group: 'bgm' });
    await am.play('bgm', { fadeMs: 5000 });
    const fadeCall = f.calls.find((c) => c.startsWith('fade:'));
    expect(fadeCall).toBeDefined();
    const dur = Number(fadeCall!.split(':')[3]);
    expect(dur).toBeLessThanOrEqual(500);
  });
});

describe('Wordpack pinyin (ZY-09-08)', () => {
  it('parses tone-mark and digit forms', () => {
    expect(parsePinyin('mā')).toMatchObject({ bare: 'ma', tone: 1 });
    expect(parsePinyin('má')).toMatchObject({ bare: 'ma', tone: 2 });
    expect(parsePinyin('ma3')).toMatchObject({ bare: 'ma', tone: 3 });
    expect(parsePinyin('hǎo')).toMatchObject({ bare: 'hao', tone: 3 });
    expect(parsePinyin('de')).toMatchObject({ bare: 'de', tone: 5 });
  });

  it('layouts hanzi+pinyin within a cell', () => {
    const layout = layoutHanziWithPinyin({ char: '好', pinyin: 'hǎo', cellSize: 100 });
    expect(layout.pinyin).toBe('hǎo');
    expect(layout.pinyinColor).toBe(TONE_COLORS[3]);
    expect(layout.hanziFontSize).toBeGreaterThan(layout.pinyinFontSize);
    expect(layout.pinyinY).toBeLessThan(layout.hanziY);
  });

  it('renders 500 chars under 100ms (perf budget)', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ char: '字', pinyin: 'zì', cellSize: 64 }));
    const start = performance.now();
    const all = items.map((it) => layoutHanziWithPinyin(it));
    const elapsed = performance.now() - start;
    expect(all).toHaveLength(500);
    expect(elapsed).toBeLessThan(100);
  });
});

describe('GameAnalytics (ZY-09-10)', () => {
  it('flushes on threshold and after explicit flush', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const an = new GameAnalytics({
      fetcher: fetcher as unknown as typeof fetch,
      maxBatchSize: 3,
      flushIntervalMs: 60_000,
    });
    an.track('a');
    an.track('b');
    expect(an.pendingCount()).toBe(2);
    an.track('c');
    // batch threshold flush is async — wait one tick
    await new Promise((r) => setTimeout(r, 0));
    await an.flush();
    expect(fetcher).toHaveBeenCalled();
    expect(an.pendingCount()).toBe(0);
  });

  it('requeues on 5xx', async () => {
    const fetcher = vi.fn(async () => new Response('boom', { status: 503 }));
    const an = new GameAnalytics({ fetcher: fetcher as unknown as typeof fetch, flushIntervalMs: 60_000 });
    an.track('x');
    await an.flush();
    expect(an.pendingCount()).toBe(1);
  });
});

describe('Fullscreen helpers (ZY-09-09)', () => {
  it('jsdom reports no fullscreen / portrait safely', () => {
    expect(isFullscreen()).toBe(false);
    expect(typeof isPortrait()).toBe('boolean');
  });
});

describe('UI helpers', () => {
  it('formats countdown mm:ss', () => {
    expect(formatCountdown(60_000)).toBe('01:00');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(45_500)).toBe('00:46');
    expect(formatCountdown(-100)).toBe('00:00');
  });
});
