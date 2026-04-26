/**
 * ZY-09 — Game playground page.
 *
 * Mounts the @zhiyu/game engine into a div, exposes a Pinyin keyboard demo,
 * shows the leaderboard and a "submit run" button. Real per-game logic
 * lives in E10 — this page validates the engine + telemetry + leaderboard
 * pipeline end-to-end.
 */
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import {
  createGame,
  GameAnalytics,
  LeaderboardClient,
  PinyinKeyboardController,
  Round,
  formatCountdown,
  PINYIN_INITIALS,
  PINYIN_FINALS,
  PINYIN_TONES,
  PINYIN_CONTROLS,
  enterFullscreen,
  exitFullscreen,
  isFullscreen as readIsFullscreen,
  type LeaderboardEntry,
} from '@zhiyu/game';

interface PlayGroundParams {
  slug: string;
}

export function GamePlaygroundPage({ slug = 'hanzi-ninja' }: { slug?: string } = {}): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const analytics = useMemo(() => new GameAnalytics({ endpoint: '/api/v1/_telemetry/event' }), []);
  const lbClient = useMemo(() => new LeaderboardClient({ baseUrl: '/api/v1/games' }), []);
  const ctrl = useMemo(() => new PinyinKeyboardController(), []);

  const [pinyinInput, setPinyinInput] = useState('');
  const [score, setScore] = useState(0);
  const [remainingMs, setRemainingMs] = useState(60_000);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [scope, setScope] = useState<'all' | 'week' | 'month' | 'daily'>('week');
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Boot engine + round once on mount.
  useEffect(() => {
    const game = createGame({ autoStart: true });
    const round = new Round(game.engine, {
      durationMs: 60_000,
      onTick: (r) => setRemainingMs(r),
      onEnd: () => analytics.track('game_end', { slug, score }),
    });
    round.start();
    analytics.start();
    analytics.track('game_start', { slug });

    const offInput = ctrl.onInput((v) => setPinyinInput(v));
    const offSubmit = ctrl.onSubmit((v) => {
      analytics.track('pinyin_submit', { slug, value: v });
      setScore((s) => s + 10);
    });

    return () => {
      offInput();
      offSubmit();
      round.stop();
      analytics.stop();
      void analytics.flush();
      game.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Fetch leaderboard whenever scope changes.
  useEffect(() => {
    let cancelled = false;
    lbClient
      .fetchLeaderboard(slug, scope)
      .then((res) => {
        if (!cancelled) setEntries(res.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [lbClient, slug, scope]);

  const onSubmitRun = async () => {
    setSubmitState('sending');
    try {
      await lbClient.submitRun(slug, { score, duration_ms: 60_000 - remainingMs || 1000 });
      setSubmitState('sent');
    } catch {
      setSubmitState('error');
    }
  };

  const onToggleFullscreen = async () => {
    if (readIsFullscreen()) {
      await exitFullscreen();
      setFullscreenActive(false);
    } else if (containerRef.current) {
      const r = await enterFullscreen(containerRef.current);
      setFullscreenActive(r.status === 'entered');
    }
  };

  const allKeys = [...PINYIN_INITIALS, ...PINYIN_FINALS, ...PINYIN_TONES, ...PINYIN_CONTROLS];

  return (
    <div className="pt-2" data-testid="game-playground" data-slug={slug}>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-h1">游戏 · {slug}</h1>
          <p className="text-body text-text-secondary">
            倒计时 <span data-testid="countdown" className="font-mono">{formatCountdown(remainingMs)}</span>
            ｜得分 <span data-testid="score" className="font-mono">{score}</span>
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-primary px-3 py-1 text-white"
          onClick={onToggleFullscreen}
          data-testid="fullscreen-toggle"
        >
          {fullscreenActive ? '退出全屏' : '全屏'}
        </button>
      </header>

      <div
        ref={containerRef}
        className="bg-surface-secondary mb-4 aspect-video w-full rounded border"
        data-testid="game-canvas"
      />

      <section className="mb-4" data-testid="pinyin-keyboard">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-body">拼音:</span>
          <span data-testid="pinyin-current" className="font-mono">{pinyinInput || '—'}</span>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {allKeys.map((key) => (
            <button
              key={`${key.group}-${key.token}`}
              type="button"
              onClick={() => ctrl.press(key)}
              className="rounded border bg-surface-primary px-2 py-1 text-body active:bg-primary/10"
              data-testid={`key-${key.group}-${key.token}`}
            >
              {key.glyph}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <button
          type="button"
          onClick={onSubmitRun}
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          disabled={submitState === 'sending'}
          data-testid="submit-run"
        >
          {submitState === 'sending' ? '提交中...' : submitState === 'sent' ? '已提交 ✓' : '提交本局成绩'}
        </button>
        {submitState === 'error' && (
          <span className="ml-3 text-error" data-testid="submit-error">
            提交失败（请登录）
          </span>
        )}
      </section>

      <section data-testid="leaderboard">
        <header className="mb-2 flex items-center gap-2">
          <h2 className="text-h2">排行榜</h2>
          <div className="ml-auto flex gap-1" role="tablist">
            {(['daily', 'week', 'month', 'all'] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={scope === s}
                type="button"
                onClick={() => setScope(s)}
                data-testid={`leaderboard-tab-${s}`}
                className={`rounded px-2 py-1 text-body ${
                  scope === s ? 'bg-primary text-white' : 'bg-surface-primary border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>
        <ol className="divide-y rounded border bg-surface-primary">
          {entries.length === 0 && (
            <li className="px-3 py-4 text-text-secondary" data-testid="leaderboard-empty">
              暂无成绩
            </li>
          )}
          {entries.map((e) => (
            <li
              key={`${e.user_id}-${e.rank}`}
              className="flex items-center gap-3 px-3 py-2"
              data-testid={`leaderboard-entry-${e.rank}`}
            >
              <span className="w-8 font-mono text-text-secondary">#{e.rank}</span>
              <span className="flex-1 truncate">{e.display_name ?? e.user_id.slice(0, 8)}</span>
              <span className="font-mono">{e.score}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

// Wrapper consumed by the router (passes slug param).
export function GamePlaygroundRoute({ params }: { params: PlayGroundParams }): JSX.Element {
  return <GamePlaygroundPage slug={params.slug} />;
}
