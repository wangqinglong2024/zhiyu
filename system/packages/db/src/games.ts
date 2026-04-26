/**
 * E09 game-engine tables (game_runs, leaderboards, events, wordpacks).
 */
import { sql } from 'drizzle-orm';
import { bigserial, index, integer, jsonb, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { zhiyu } from './schema.js';

export const gameRuns = zhiyu.table(
  'game_runs',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    userId: uuid('user_id').notNull(),
    gameId: text('game_id').notNull(),
    score: integer('score').notNull(),
    durationMs: integer('duration_ms').notNull(),
    meta: jsonb('meta').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    gameScoreIdx: index('game_runs_game_score_idx').on(t.gameId, t.score, t.createdAt),
    userIdx: index('game_runs_user_idx').on(t.userId, t.createdAt),
  }),
);

export const leaderboards = zhiyu.table(
  'leaderboards',
  {
    gameId: text('game_id').notNull(),
    scope: text('scope').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull().default(sql`'epoch'::timestamptz`),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    ranks: jsonb('ranks').notNull().default(sql`'[]'::jsonb`),
    refreshedAt: timestamp('refreshed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.gameId, t.scope, t.periodStart] }),
  }),
);

export const events = zhiyu.table(
  'events',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
    userId: uuid('user_id'),
    name: text('name').notNull(),
    props: jsonb('props').notNull().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    nameTsIdx: index('events_name_ts_idx').on(t.name, t.ts),
    userTsIdx: index('events_user_ts_idx').on(t.userId, t.ts),
  }),
);

export const wordpacks = zhiyu.table(
  'wordpacks',
  {
    id: text('id').primaryKey(),
    hskLevel: smallint('hsk_level').notNull().default(1),
    items: jsonb('items').notNull().default(sql`'[]'::jsonb`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export type LeaderboardScope = 'all' | 'week' | 'month' | 'daily';
