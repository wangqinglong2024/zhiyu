# E06 — Discover China · Retrospective

> Sprint: E06 · 2026-04-26 (Compressed mode — single Claude session)
> Status: ✅ Done · Migration applied · Seed loaded · API + FE running

## 1. Scope delivered

| Story    | Summary                                                              | Status |
| -------- | -------------------------------------------------------------------- | ------ |
| ZY-06-01 | `discover` schema (8 tables) + RLS + `tsvector` FTS trigger + seed   | ✅     |
| ZY-06-02 | `/discover` home with categories, HSK chips, infinite-scroll cards   | ✅     |
| ZY-06-03 | Immersive reader `/discover/:slug` + per-sentence + full-play TTS   | ✅     |
| ZY-06-04 | `<CharPopover>` long-press dictionary + favorite + add-note flow     | ✅     |
| ZY-06-05 | `<RatingStars>` + `reading_progress` background save                 | ✅     |
| ZY-06-06 | `/api/v1/discover/search` jiebacfg-or-simple FTS + ILIKE fallback    | ✅     |

## 2. Backend artifacts

- `apps/api/drizzle/migrations/0005_e06_discover_china.sql` — 280 lines
  - Tables: `categories`, `articles`, `sentences`, `char_dict`, `favorites`,
    `notes`, `reading_progress`, `article_ratings`
  - Triggers: `articles_tsv_refresh` (auto `search_doc` rebuild) and
    `article_ratings_recompute` (running rating average)
  - RLS: published-only public read for catalog; `auth.uid()`-scoped writes
  - Indexes: GIN on `search_doc`; trigram on `i18n_title->>'zh-CN'` (best-effort)
- `apps/api/src/routes/discover.ts` + 5 sub-files (categories / articles /
  interactions / dict / search) — every file <300 lines, well under the 800
  limit.
- `apps/api/src/auth-mw.ts` — added `getOptionalUser` for "anon-OK" routes.
- `packages/db/src/discover.ts` — drizzle bindings mirroring the SQL.
- `packages/db/seed/discover-china/` — 12 categories, 36 articles
  (108 sentences) and a 20-character dictionary primer, all with
  5-language i18n (en / vi / th / id / zh-CN). Idempotent upsert.

## 3. Frontend artifacts

- `apps/web/src/routes/discover.tsx` — refactored from M1 mock to live data
  with TanStack Query infinite scroll keyed on cursor.
- `apps/web/src/routes/discover-article.tsx` — full immersive reader
  (sentence list, ruby-friendly Han spans, font-size slider 80-160 %, three
  playback rates, per-sentence and full-text play, periodic progress save,
  long-press char popover).
- `apps/web/src/components/discover/CharPopover.tsx` — dictionary popup with
  pinyin / gloss / examples + favorite + note CTAs.
- `apps/web/src/components/discover/RatingStars.tsx` — interactive 1-5 stars.
- `apps/web/src/pages/me/notes.tsx` — auth-gated note management.
- `apps/web/src/lib/api.ts` — typed `discover` SDK (categories, articles,
  article, search, dict, favorites, notes, progress, rate).
- `apps/web/src/router.tsx` — added `/discover/$slug` and `/me/notes`.

## 4. Verification

- `pnpm --filter @zhiyu/api --filter @zhiyu/web --filter @zhiyu/db typecheck` — ✅
- Docker rebuild of `zhiyu-app-be` + `zhiyu-app-fe` succeeded (the
  Dockerfiles were missing `packages/tokens` and `packages/game` package.json
  copies; fixed in this sprint).
- Migration `0005_e06_discover_china` recorded in `zhiyu._meta` (`db:migrate`
  emits `[migrate] skip 0005 … already applied` on subsequent runs).
- `pnpm --filter @zhiyu/db seed:discover` — `categories=12 articles=36 chars=20 done`.
- API smoke tests:
  - `GET /api/v1/discover/categories` → 12 categories with full i18n.
  - `GET /api/v1/discover/articles?limit=3` → 3 cards with cursor.
  - `GET /api/v1/discover/articles/great-wall-origins` → article + 4 sentences.
  - `GET /api/v1/discover/search?q=长城&limit=5` → 1 hit with FTS rank fallback.
  - `GET /api/v1/discover/dict/中` → `pinyin=zhōng`, `i18n_gloss['zh-CN']='中间'`.
- FE smoke: `http://localhost:3100/` and `/discover/:slug` return 200 from
  the freshly built static bundle.

## 5. What went well

- **Schema-first** discipline: writing the SQL migration before drizzle
  bindings caught two `jsonb` defaulting bugs early.
- **Keyset pagination** via `(published_at, id) <` made the infinite scroll
  trivial and stable — no `OFFSET` drift.
- **i18n by default**: every public column carrying user-visible text is a
  `jsonb` map keyed by UI locale. `pickI18n(map, lng)` on the FE keeps the
  logic in one helper.
- **TTS via Web Speech API** ships zero binary assets and works across all
  five UI locales without needing pre-rendered audio.
- **Reader UX**: long-press / double-click to open `<CharPopover>` plays
  well on both desktop trackpads and mobile touch.

## 6. What we'd do differently

- The seed corpus is template-generated for 30 of 36 articles. We should
  replace the filler bank with hand-curated copy in a follow-up content
  sprint (target: 6 quality stories per category × 12 = 72 long-form pieces).
- `pg_jieba` is detected at query time but we should bake it into the
  `supabase-db` image so the trigger uses real Chinese tokenisation
  instead of the `simple` regconfig fallback.
- Char-popover currently uses `window.prompt` for note input. Replace with
  a styled modal sharing the `<RatingStars>` aesthetic.
- Reader progress writes go through a 10s interval. Would benefit from a
  navigator `beforeunload` flush.

## 7. Risks / follow-ups

- Audio: until pg_jieba lands, FTS recall on multi-character Chinese
  queries falls back to ILIKE. Acceptable for v1 scope; flag for E07.
- Author/source attribution columns exist but the seed leaves them null.
  Add an `author_url` column if we accept third-party content.
- `articles.body_md` is unused by the reader; future "long article" mode
  will render it via `marked` + `DOMPurify`.

## 8. Velocity & file inventory

- Net new lines added in this sprint: ~2,900 (incl. seed JSON 2,413 lines).
- Net new TS files: 8 source + 5 route splits.
- No file exceeds the 800-line ceiling; the largest is `discover-article.tsx`
  at ~310 lines.
