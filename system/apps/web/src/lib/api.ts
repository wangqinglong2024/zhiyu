const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export type ApiError = { error: string; issues?: unknown; detail?: string; retry_after_seconds?: number; retry_after_days?: number };

const camelToSnake = (s: string): string => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

function normalize<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => normalize(v)) as unknown as T;
  if (value && typeof value === 'object' && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[camelToSnake(k)] = normalize(v);
    }
    return out as T;
  }
  return value as T;
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = (body && typeof body === 'object' ? (body as ApiError) : { error: 'http_error' }) as ApiError;
    throw Object.assign(new Error(err.error ?? 'http_error'), { status: res.status, body: err });
  }
  return normalize<T>(body);
}

export const auth = {
  signUp: (email: string) => api<{ challenge_id: string; dev_code?: string }>('/api/v1/auth/sign-up', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (payload: { challenge_id: string; code: string; password?: string; display_name?: string; locale?: string }) =>
    api<{ user: { id: string; email: string }; access_token: string }>('/api/v1/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  signIn: (email: string, password: string) =>
    api<{ user: { id: string; email: string }; access_token: string }>('/api/v1/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signOut: () => api<{ ok: boolean }>('/api/v1/auth/sign-out', { method: 'POST' }),
  me: () => api<{ user: { id: string; email: string | null } }>('/api/v1/auth/me'),
  providers: () => api<{ providers: { google: boolean; apple: boolean } }>('/api/v1/auth/providers'),
  resetRequest: (email: string) =>
    api<{ challenge_id: string; dev_code?: string }>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetConfirm: (payload: { challenge_id: string; code: string; new_password: string }) =>
    api<{ ok: boolean }>('/api/v1/auth/reset-password/confirm', { method: 'POST', body: JSON.stringify(payload) }),
};

export const me = {
  get: () => api<{ profile: Record<string, unknown>; settings: Record<string, unknown> | null; email: string | null }>('/api/v1/me'),
  patch: (patch: Record<string, unknown>) => api<{ ok: boolean }>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(patch) }),
  settingsGet: () => api<Record<string, unknown>>('/api/v1/me/settings'),
  settingsPatch: (patch: Record<string, unknown>) => api<{ ok: boolean }>('/api/v1/me/settings', { method: 'PATCH', body: JSON.stringify(patch) }),
  signAvatar: (filename: string, contentType: string) =>
    api<{ upload_url: string; token: string; path: string; public_url: string; fake?: boolean }>(
      '/api/v1/me/avatar/sign',
      { method: 'POST', body: JSON.stringify({ filename, content_type: contentType }) },
    ),
  sessions: () => api<{ sessions: Array<{ id: string; current: boolean; user_agent: string | null; ip: string; last_seen_at: string }> }>('/api/v1/me/sessions'),
  revokeAll: (keepCurrent: boolean) => api<{ ok: boolean }>(`/api/v1/me/sessions?keepCurrent=${keepCurrent}`, { method: 'DELETE' }),
  revokeOne: (id: string) => api<{ ok: boolean }>(`/api/v1/me/sessions/${id}`, { method: 'DELETE' }),
  exportEnqueue: () => api<{ id: string; status: string }>('/api/v1/me/export', { method: 'POST' }),
  exportList: () => api<{ exports: Array<{ id: string; status: string; download_url: string | null; created_at: string; completed_at: string | null }> }>('/api/v1/me/exports'),
  deleteAccount: (password?: string) => api<{ ok: boolean; scheduled_for: string }>('/api/v1/me/delete', { method: 'POST', body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT', password }) }),
  deleteCancel: () => api<{ ok: boolean }>('/api/v1/me/delete/cancel', { method: 'POST' }),
  deleteStatus: () => api<{ pending: boolean; scheduled_for?: string; cancelled_at?: string | null; executed_at?: string | null }>('/api/v1/me/delete/status'),
};


// ---- E06 Discover China ----
export interface DiscoverCategory {
  id: number;
  slug: string;
  emoji: string | null;
  cover_url: string | null;
  i18n_name: Record<string, string>;
  i18n_summary: Record<string, string>;
  sort_order: number;
}

export interface DiscoverArticleCard {
  id: string;
  slug: string;
  category_id: number;
  hsk_level: number;
  cover_url: string | null;
  estimated_minutes: number;
  i18n_title: Record<string, string>;
  i18n_summary: Record<string, string>;
  rating_avg: string | number;
  rating_count: number;
  views?: number;
  published_at: string | null;
}

export interface DiscoverSentence {
  id: number;
  article_id: string;
  idx: number;
  zh: string;
  pinyin: string | null;
  i18n_translation: Record<string, string>;
  audio_url: string | null;
}

export interface DiscoverArticleFull extends DiscoverArticleCard {
  body_md: string;
  audio_voice: string;
  author: string | null;
  status: string;
}

export interface DiscoverDictEntry {
  ch: string;
  pinyin: string | null;
  i18n_gloss: Record<string, string>;
  examples: Array<{ zh: string; pinyin?: string; i18n?: Record<string, string> }>;
  audio_url: string | null;
  hsk_level: number | null;
}

export const discover = {
  categories: () =>
    api<{ categories: DiscoverCategory[] }>('/api/v1/discover/categories'),
  articles: (params: { category?: string; hsk?: number; cursor?: string; limit?: number; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set('category', params.category);
    if (params.hsk) sp.set('hsk', String(params.hsk));
    if (params.cursor) sp.set('cursor', params.cursor);
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.q) sp.set('q', params.q);
    const qs = sp.toString();
    return api<{ items: DiscoverArticleCard[]; next_cursor: string | null }>(
      `/api/v1/discover/articles${qs ? `?${qs}` : ''}`,
    );
  },
  article: (slug: string) =>
    api<{
      article: DiscoverArticleFull;
      sentences: DiscoverSentence[];
      progress: { last_sentence_idx?: number; scroll_pct?: number; accumulated_seconds?: number; completed?: boolean } | null;
      rating_mine: number | null;
    }>(`/api/v1/discover/articles/${encodeURIComponent(slug)}`),
  search: (q: string, limit = 10) =>
    api<{ q: string; total: number; items: Array<DiscoverArticleCard & { rank: number | null; highlight: string }> }>(
      `/api/v1/discover/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
  dict: (ch: string) =>
    api<{ entry: DiscoverDictEntry }>(`/api/v1/discover/dict/${encodeURIComponent(ch)}`),
  rate: (slug: string, score: number) =>
    api<{ ok: boolean }>(`/api/v1/discover/articles/${encodeURIComponent(slug)}/rating`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),
  favorites: {
    list: () =>
      api<{ items: Array<{ id: number; entity_type: string; entity_id: string; created_at: string }> }>(
        '/api/v1/discover/favorites',
      ),
    add: (entity_type: string, entity_id: string) =>
      api<{ ok: boolean }>('/api/v1/discover/favorites', {
        method: 'POST',
        body: JSON.stringify({ entity_type, entity_id }),
      }),
    remove: (entity_type: string, entity_id: string) =>
      api<{ ok: boolean }>('/api/v1/discover/favorites', {
        method: 'DELETE',
        body: JSON.stringify({ entity_type, entity_id }),
      }),
  },
  notes: {
    list: () =>
      api<{ items: Array<{ id: string; target_type: string; target_id: string; body: string; color: string; updated_at: string; created_at: string }> }>(
        '/api/v1/discover/notes',
      ),
    create: (target_type: string, target_id: string, body: string, color?: string) =>
      api<{ note: { id: string } }>('/api/v1/discover/notes', {
        method: 'POST',
        body: JSON.stringify({ target_type, target_id, body, color }),
      }),
    patch: (id: string, patch: { body?: string; color?: string }) =>
      api<{ note: { id: string } }>(`/api/v1/discover/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    remove: (id: string) =>
      api<{ ok: boolean }>(`/api/v1/discover/notes/${id}`, { method: 'DELETE' }),
  },
  progress: {
    save: (payload: {
      article_id: string;
      last_sentence_idx?: number;
      scroll_pct?: number;
      delta_seconds?: number;
      completed?: boolean;
    }) =>
      api<{ ok: boolean }>('/api/v1/discover/progress', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: () =>
      api<{ items: Array<{ article_id: string; last_sentence_idx: number; scroll_pct: string; accumulated_seconds: number; completed: boolean; last_seen_at: string }> }>(
        '/api/v1/discover/progress',
      ),
  },
};


// ---- E07 Learning Engine ----
export interface CourseCard {
  id: string;
  slug: string;
  track: string;
  hsk_level: number;
  i18n_title: Record<string, string>;
  i18n_summary: Record<string, string>;
  cover_url: string | null;
  sort_order: number;
}

export interface Enrollment {
  id: string;
  course_id: string;
  course_slug?: string;
  course_title?: Record<string, string>;
  status: 'active' | 'completed' | 'reset';
  progress_percent: number;
  current_lesson_id: string | null;
  started_at: string;
  last_active_at: string;
}

export interface LessonStep {
  type: string;
  title?: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface LessonDetail {
  lesson: {
    id: string;
    course_id: string;
    slug: string;
    position: number;
    i18n_title: Record<string, string>;
    steps: LessonStep[];
  };
  progress: Array<{ step_index: number; passed: boolean; score: string | number; updated_at: string }>;
}

export interface AdvanceResult {
  score: number;
  passed: boolean;
  mistakes: Array<{ question_id: string; reason?: string }>;
  resolved_mistake_question_ids: string[];
  lesson_complete: boolean;
  next_step_index: number | null;
  xp?: { awarded: number; level_up: boolean; streak_current: number };
}

export interface SrsCard {
  id: string;
  word: string;
  pinyin: string | null;
  i18n_gloss: Record<string, string> | null;
  source: string | null;
  reps: number;
  lapses: number;
  ease: string | number;
  interval_days: number;
  due_at: string;
}

export interface ProgressionState {
  xp: number;
  level: number;
  streak_current: number;
  streak_max: number;
  freeze_count: number;
  xp_to_next: number;
  progress_to_next: number;
  double_xp: boolean;
}

export interface DashboardCards {
  xp: ProgressionState;
  streak: { current: number; max: number; freeze_count: number };
  today_srs: { due: number; mistakes_open: number; wordbook_size: number };
  continue: {
    enrollment_id: string;
    course_id: string;
    course_slug: string;
    course_title: Record<string, string>;
    progress_percent: number;
    current_lesson_id: string | null;
    current_lesson_title: Record<string, string> | null;
    last_active_at: string;
  } | null;
  recommend: { items: CourseCard[] };
  achievements: { completed_lessons: number; active_enrollments: number; badges: string[] };
}

export const learning = {
  courses: () => api<{ items: CourseCard[] }>('/api/v1/courses'),
  course: (id: string) => api<{ course: CourseCard; lessons: Array<{ id: string; slug: string; position: number; i18n_title: Record<string, string> }> }>(`/api/v1/courses/${id}`),
  enroll: (id: string) => api<{ enrollment: Enrollment }>(`/api/v1/courses/${id}/enroll`, { method: 'POST' }),
  myEnrollments: () => api<{ items: Enrollment[] }>('/api/v1/me/enrollments'),
  resetEnrollment: (id: string) => api<{ enrollment: Enrollment }>(`/api/v1/me/enrollments/${id}/reset`, { method: 'POST' }),
  lesson: (id: string) => api<LessonDetail>(`/api/v1/lessons/${id}`),
  answerStep: (lessonId: string, stepIdx: number, payload: Record<string, unknown>) =>
    api<AdvanceResult>(`/api/v1/lessons/${lessonId}/steps/${stepIdx}/answer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const srs = {
  queue: (limit = 20) => api<{ items: SrsCard[] }>(`/api/v1/srs/queue?limit=${limit}`),
  add: (payload: { word: string; pinyin?: string; i18n_gloss?: Record<string, string>; source?: string }) =>
    api<{ card: SrsCard }>('/api/v1/srs/cards', { method: 'POST', body: JSON.stringify(payload) }),
  review: (id: string, grade: 1 | 2 | 3 | 4) =>
    api<{ card: SrsCard; xp?: { awarded: number } }>(`/api/v1/srs/cards/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    }),
  stats: () => api<{ due: number; total: number; lapses: number; due_tomorrow: number }>('/api/v1/srs/stats'),
};

export const wordbook = {
  list: () => api<{ items: Array<{ id: string; word: string; pinyin: string | null; i18n_gloss: Record<string, string> | null; source: string | null; created_at: string }> }>('/api/v1/me/wordbook'),
  add: (payload: { word: string; pinyin?: string; i18n_gloss?: Record<string, string>; source?: string }) =>
    api<{ item: { id: string } }>('/api/v1/me/wordbook', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id: string) => api<{ ok: boolean }>(`/api/v1/me/wordbook/${id}`, { method: 'DELETE' }),
};

export const mistakes = {
  list: (filter: { resolved?: boolean; lesson_id?: string } = {}) => {
    const sp = new URLSearchParams();
    if (typeof filter.resolved === 'boolean') sp.set('resolved', String(filter.resolved));
    if (filter.lesson_id) sp.set('lesson_id', filter.lesson_id);
    const qs = sp.toString();
    return api<{ items: Array<{ id: string; lesson_id: string; question_id: string; question_type: string; payload: Record<string, unknown>; reason: string | null; resolved_at: string | null; created_at: string }> }>(
      `/api/v1/me/mistakes${qs ? `?${qs}` : ''}`,
    );
  },
  redo: (id: string) => api<{ ok: boolean; resolved_at: string }>(`/api/v1/me/mistakes/${id}/redo`, { method: 'POST' }),
};

export const hsk = {
  questions: () => api<{ questions: Array<{ id: string; level: number; prompt: string; choices: string[] }> }>('/api/v1/hsk/questions'),
  submit: (answers: Array<{ question_id: string; selected: number }>) =>
    api<{ recommended_level: number; correct_count: number; total_questions: number; per_level: Record<string, { asked: number; correct: number }> }>(
      '/api/v1/hsk/submit',
      { method: 'POST', body: JSON.stringify({ answers }) },
    ),
  last: () =>
    api<{ result: { id: string; recommended_level: number; correct_count: number; total_questions: number; details: unknown; completed_at: string } | null }>('/api/v1/me/hsk/last'),
};

export const progression = {
  get: () => api<ProgressionState>('/api/v1/me/progression'),
  log: (limit = 50) => api<{ items: Array<{ id: string; amount: number; source: string; meta: Record<string, unknown> | null; created_at: string }> }>(`/api/v1/me/progression/log?limit=${limit}`),
  checkin: () => api<{ awarded: number; streak_current: number }>('/api/v1/me/progression/checkin', { method: 'POST' }),
};

export const dashboard = {
  get: () => api<{ cards: DashboardCards; layout: { card_order: string[] } }>('/api/v1/me/dashboard'),
  setLayout: (cardOrder: string[]) =>
    api<{ ok: boolean; card_order: string[] }>('/api/v1/me/dashboard/layout', {
      method: 'PATCH',
      body: JSON.stringify({ card_order: cardOrder }),
    }),
};
