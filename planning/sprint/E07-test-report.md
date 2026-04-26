# E07 学习引擎 — Test Report

**Date:** 2026-04-26  
**Environment:** Local Docker (zhiyu-app-be:8100, zhiyu-app-fe:3100, zhiyu-worker, supabase-db).  
**Tester:** Copilot autonomous run.

---

## 1. Approach

The user-requested per-page MCP browser automation could not run in this autonomous turn (browser MCP server not available without dynamic tool discovery, which the project's policy disallows). As an equivalent verification we executed:

1. **Unit tests** — Vitest 4 suites, 34 cases, all green.
2. **Smoke API walkthrough** — curl-based end-to-end traversal of every E07 endpoint, including auth bootstrap, lesson playthrough, and dashboard aggregation.
3. **Manual route surface check** — `curl /api/v1/_routes`-style enumeration via direct hits to ensure each registered handler returns a sensible response.

A follow-up MCP browser pass on `/learn`, `/lesson/:id`, `/srs`, `/me/wordbook`, `/me/mistakes`, `/onboarding/hsk`, `/me` should be scheduled when the browser tool is reintroduced — see "Pending Manual Steps" below.

---

## 2. Unit Tests

```text
$ pnpm --filter @zhiyu/api test

 ✓ test/lesson.engine.test.ts  (11 tests)
 ✓ test/hsk.assessment.test.ts (7 tests)
 ✓ test/xp.streak.test.ts      (8 tests)
 ✓ test/srs.test.ts            (8 tests)

 Test Files  4 passed (4)
 Tests       34 passed (34)
```

---

## 3. End-to-end Walkthrough

**User:** `e07b@example.com` (auto sign-up + verify-otp + cookie session).

| Step | Endpoint | Result |
|---|---|---|
| 1 | `GET /api/v1/courses` | 4 published courses returned. |
| 2 | `POST /api/v1/courses/:id/enroll` | 201 — enrollment id, `currentLessonId` populated. |
| 3 | `GET /api/v1/me/enrollments` | 1 active row, normalized snake_case. |
| 4 | `POST /api/v1/lessons/:id/steps/0/answer` (intro) | `passed: true, score: 1, next: 1`. |
| 5 | `POST .../steps/8/answer` before step 5/6/7 | **gating works** — 400 `previous_step_not_done`, `need_step: 7`. |
| 6 | `POST .../steps/{1..4,5,6,7,8,9}` in order | All pass; final returns `lesson_complete: true`, `hint: { type: 'recommend_srs' }`. |
| 7 | `GET /api/v1/me/progression` | `xp=80, level=0, streakCurrent=1, streakMax=1, freezeCount=1`. |
| 8 | `GET /api/v1/me/dashboard` | 6 cards present; `progress_percent=33.33` (1/3 lessons); `current_lesson_title="Numbers"`. |
| 9 | `GET /api/v1/srs/queue` | Empty for fresh user (cards inserted only when answer payload includes `word:` question_id with `chosen` / `expected` / suffix). |
| 10 | `GET /api/v1/hsk/questions` | 30 questions, 5 per HSK1-6, no `answer` field leaked. |

All endpoints respond <100ms locally; dashboard aggregation in single round-trip via SQL helper `zhiyu.dashboard_snapshot`.

---

## 4. RLS / Authorization Spot Checks

- Unauthenticated `GET /api/v1/me/dashboard` → 401.
- Unauthenticated `GET /api/v1/courses` → 200 (catalog is public).
- Cross-user attempt to read another user's enrollment denied at RLS layer (per-user owner policies on 9 tables defined in migration 0006).

---

## 5. Pending Manual Steps (browser-based)

The FE pages were typechecked (`pnpm --filter @zhiyu/web typecheck` clean) and built into the Docker image, but a per-page click-through is still recommended:

- `/learn` — enroll + reset buttons, `data-testid` markers added: `enroll-*`, `continue-*`.
- `/lesson/:id` — 10-step runner, `data-testid="lesson-page|submit|quickpass|last-result"`.
- `/srs` — review queue, `srs-grade-{1..4}` markers.
- `/me/wordbook` — manual add + CSV export link.
- `/me/mistakes` — list + redo + show-resolved toggle.
- `/onboarding/hsk` — 30-Q form + result panel.

When the MCP browser server is re-enabled, navigate to each route, check rendering, exercise each `data-testid`, and append findings to this file.

---

## 6. Verdict

✅ Backend behaviour validated end-to-end; all unit tests green; no blocking issues remain.  
⚠️ Browser-based UI interaction still needs a follow-up pass.
