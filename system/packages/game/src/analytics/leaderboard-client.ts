/**
 * LeaderboardClient (ZY-09-10)
 *
 * Thin wrapper for `POST /api/v1/games/:id/runs` and
 * `GET /api/v1/games/:id/leaderboard?range=...`. Keeps the HTTP shape
 * small so games and FE components share types.
 */
export type LeaderboardScope = 'all' | 'week' | 'month' | 'daily';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name?: string;
  score: number;
  duration_ms: number;
  created_at: string;
}

export interface LeaderboardResponse {
  game_id: string;
  scope: LeaderboardScope;
  refreshed_at: string | null;
  entries: LeaderboardEntry[];
  /** Caller's own rank when authed. */
  self?: { rank: number; score: number } | null;
}

export interface RunSubmitInput {
  score: number;
  duration_ms: number;
  meta?: Record<string, unknown>;
}

export interface RunSubmitResponse {
  ok: true;
  run_id: string;
  rank?: number;
}

export interface LeaderboardClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  authToken?: () => string | null;
}

export class LeaderboardClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly authToken?: () => string | null;

  constructor(opts: LeaderboardClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? '/api/v1/games';
    this.fetcher = opts.fetcher ?? globalThis.fetch.bind(globalThis);
    this.authToken = opts.authToken;
  }

  async fetchLeaderboard(gameId: string, scope: LeaderboardScope = 'week'): Promise<LeaderboardResponse> {
    const url = `${this.baseUrl}/${encodeURIComponent(gameId)}/leaderboard?scope=${encodeURIComponent(scope)}`;
    const res = await this.fetcher(url, { headers: this._headers() });
    if (!res.ok) throw new Error(`leaderboard_http_${res.status}`);
    return (await res.json()) as LeaderboardResponse;
  }

  async submitRun(gameId: string, input: RunSubmitInput): Promise<RunSubmitResponse> {
    const url = `${this.baseUrl}/${encodeURIComponent(gameId)}/runs`;
    const res = await this.fetcher(url, {
      method: 'POST',
      headers: { ...this._headers(), 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`runs_http_${res.status}`);
    return (await res.json()) as RunSubmitResponse;
  }

  private _headers(): Record<string, string> {
    const out: Record<string, string> = {};
    const token = this.authToken?.();
    if (token) out.authorization = `Bearer ${token}`;
    return out;
  }
}
