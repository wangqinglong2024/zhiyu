/**
 * E07 — Learning engine (drizzle schema bindings, part 2).
 * SRS, XP, HSK, dashboard layout. See migrations/0006_e07_learning_engine.sql.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  date,
  index,
  integer,
  jsonb,
  numeric,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { zhiyu } from './schema.js';

export const srsCards = zhiyu.table(
  'srs_cards',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    word: text('word').notNull(),
    pinyin: text('pinyin'),
    meaning: text('meaning'),
    source: text('source').notNull().default('manual'),
    intervalDays: numeric('interval_days', { precision: 6, scale: 2 }).notNull().default('0'),
    ease: numeric('ease', { precision: 4, scale: 2 }).notNull().default('2.5'),
    dueAt: date('due_at').notNull().defaultNow(),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    lastGrade: smallint('last_grade'),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userDueIdx: index('srs_cards_user_due_idx').on(t.userId, t.dueAt) }),
);

export const userProgression = zhiyu.table('user_progression', {
  userId: uuid('user_id').primaryKey(),
  xp: bigint('xp', { mode: 'number' }).notNull().default(0),
  level: integer('level').notNull().default(0),
  streakCurrent: integer('streak_current').notNull().default(0),
  streakMax: integer('streak_max').notNull().default(0),
  lastActiveDate: date('last_active_date'),
  freezeCount: integer('freeze_count').notNull().default(0),
  freezeGrantedMonth: text('freeze_granted_month'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const xpLog = zhiyu.table(
  'xp_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').notNull(),
    delta: integer('delta').notNull(),
    source: text('source').notNull(),
    meta: jsonb('meta').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userRecentIdx: index('xp_log_user_recent_idx').on(t.userId, t.createdAt) }),
);

export const hskResults = zhiyu.table(
  'hsk_results',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    correctCount: integer('correct_count').notNull(),
    perLevel: jsonb('per_level').notNull().default(sql`'{}'::jsonb`),
    recommendedLevel: smallint('recommended_level').notNull().default(0),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index('hsk_results_user_idx').on(t.userId, t.createdAt) }),
);

export const dashboardLayout = zhiyu.table('dashboard_layout', {
  userId: uuid('user_id').primaryKey(),
  cardOrder: text('card_order').array().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
