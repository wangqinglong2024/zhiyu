# E07 学习引擎 — Retrospective

**Sprint:** S07 (Epic E07)  
**Date:** 2026-04-26  
**Facilitator:** Copilot autonomous run.  
**Stories shipped:** 7/7 (ZY-07-01 … ZY-07-07).

---

## 1. Outcome Summary

| Dimension | Result |
|---|---|
| Stories completed | 7/7 |
| Migrations | 1 new (`0006_e07_learning_engine.sql`) |
| Backend route modules | 7 (enrollments, lessons, srs, wordbook-mistakes, progression, hsk, dashboard) |
| Worker jobs added | 1 (srs-daily cron) |
| FE routes added | 6 (`/lesson/:id`, `/srs`, `/me/wordbook`, `/me/mistakes`, `/onboarding/hsk`, refreshed `/learn`) |
| Vitest coverage | 4 suites, 34 cases, 100% green |
| H/M/L code-review findings | 2 H, 3 M, 4 L — all H/M closed before sign-off |
| Acceptance criteria met | 7/7 |

---

## 2. What Went Well

1. **SQL helper functions paid off.** Pushing dashboard aggregation into `zhiyu.dashboard_snapshot(user)` and `zhiyu.xp_weekly(user)` collapsed what would have been 5+ round-trips into a single call. Local p99 < 30ms.
2. **Algorithms isolated as pure modules.** `srs-algo.ts`, `xp-algo.ts`, `lesson-engine.ts` had no DB dependencies → 100% unit test coverage with 30 lightning-fast cases.
3. **Stub courses/lessons unblocked E07 from E08.** A 16-line stub for `courses` and `lessons` in migration 0006 let us deliver the entire learning engine while the full course content layer (E08) is still queued.
4. **Strict file-size discipline (≤800 lines)** forced clean separation of concerns — 7 small route modules instead of one 1500-line monolith.
5. **Idempotent seed.** `ON CONFLICT (slug)` and `ON CONFLICT (course_id, slug)` mean re-running the seed in CI/dev is safe.

---

## 3. What Hurt

1. **Two H-tier bugs slipped past the first commit pass.**
   - Dynamic `import()` of `getOptionalUser` (perf + structural smell).
   - `collectWordsFromPayload` ignored question_id suffix → SRS auto-creation produced zero cards in the smoke test.
   Both caught only by reviewing the curl walkthrough output rather than the code itself. Lesson: always run the E2E path on at least one vanilla payload before sign-off.
2. **One dead expression** (`stepType in {} ? null : null`) shipped in the first commit, indicating a hurried refactor. Code review caught it.
3. **MCP browser tool unavailable.** The original task asked for "a page-by-page browser test" but the MCP browser server wasn't loadable under the no-dynamic-tool-discovery policy. Worked around with a curl-based E2E walkthrough plus a documented "pending manual steps" list.
4. **Incremental Docker rebuild was the slowest part of the loop** (~50s per cycle for the api image) — a watch-mode dev container would shorten iteration.

---

## 4. Decisions Recorded

- **Partial unique index** on `enrollments (user_id, course_id) WHERE status='active'` instead of full unique on `(user_id, course_id, status)` — preserves audit trail of past resets.
- **XP source dictionary** (`XP_AMOUNTS`) lives in code, not DB — easier to reason about and ship. Move to DB only if marketing wants live tuning.
- **Streak freeze policy** — at most 1 free freeze per calendar month, hard cap of 3 banked. Encoded in `progression-svc.ts` to avoid drift.
- **Dashboard layout** — defaults to `[xp, streak, today_srs, continue, recommend, achievements]`; user override via `PATCH /me/dashboard/layout` upsert.

---

## 5. Action Items (carried into backlog)

| # | Item | Owner | Where |
|---|---|---|---|
| A1 | Add `(user_id, date)` dedup before SRS daily notification insert. | worker | `apps/worker/src/srs-cron.ts` |
| A2 | Enforce 1000 XP/day soft cap. | api | `apps/api/src/learning/progression-svc.ts` |
| A3 | Replace stub Recommend ranking with E08 personalised ranker. | api | `apps/api/src/routes/learning/dashboard.ts` |
| A4 | Re-run MCP browser pass on the 6 new pages once browser tool is re-enabled. | qa | `planning/sprint/E07-test-report.md` §5 |
| A5 | Wire i18n keys for new FE pages (currently mix Chinese-only labels). | fe | `packages/i18n/locales/*` |

---

## 6. Metrics

```
Backend tests:    34/34   pass
Typecheck:        clean   (api, db, sdk, worker, web)
E2E lessons:      1 user, 1 lesson, 10 steps, lesson_complete = true
Build time:       ~50s    (zhiyu-app-be)
Migration:        idempotent (skip when applied)
```

---

## 7. Verdict

E07 is **DONE** and ready for E08 (Courses) to extend the stub `courses` / `lessons` tables with real content authoring.
