/**
 * E07 — Learning engine (drizzle schema bindings).
 * Mirrors apps/api/drizzle/migrations/0006_e07_learning_engine.sql.
 * Split from `learning-progress.ts` to keep files under the 800-line cap.
 */
import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { zhiyu } from './schema.js';

// ---- Course catalog (stub — extended by E08) ----------------------------
export const courses = zhiyu.table(
  'courses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: text('slug').notNull().unique(),
    track: text('track').notNull().default('daily'),
    hskLevel: smallint('hsk_level').notNull().default(1),
    i18nTitle: jsonb('i18n_title').notNull().default(sql`'{}'::jsonb`),
    i18nSummary: jsonb('i18n_summary').notNull().default(sql`'{}'::jsonb`),
    coverUrl: text('cover_url'),
    isFree: boolean('is_free').notNull().default(true),
    status: text('status').notNull().default('published'),
    sortOrder: smallint('sort_order').notNull().default(0),
    lessonCount: smallint('lesson_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ trackIdx: index('courses_track_idx').on(t.track, t.sortOrder) }),
);

export const lessons = zhiyu.table(
  'lessons',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    courseId: uuid('course_id').notNull(),
    slug: text('slug').notNull(),
    i18nTitle: jsonb('i18n_title').notNull().default(sql`'{}'::jsonb`),
    i18nSummary: jsonb('i18n_summary').notNull().default(sql`'{}'::jsonb`),
    steps: jsonb('steps').notNull().default(sql`'[]'::jsonb`),
    position: smallint('position').notNull().default(0),
    estimatedMinutes: smallint('estimated_minutes').notNull().default(8),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    coursePositionIdx: index('lessons_course_pos_idx').on(t.courseId, t.position),
    courseSlugUx: uniqueIndex('lessons_course_slug_uidx').on(t.courseId, t.slug),
  }),
);

// ---- Enrollment / progress ---------------------------------------------
export const enrollments = zhiyu.table(
  'enrollments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    courseId: uuid('course_id').notNull(),
    status: text('status').notNull().default('active'),
    currentLessonId: uuid('current_lesson_id'),
    progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }).notNull().default('0'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    resetAt: timestamp('reset_at', { withTimezone: true }),
  },
  (t) => ({
    userStatusIdx: index('enrollments_user_status_idx').on(t.userId, t.status),
    courseIdx: index('enrollments_course_idx').on(t.courseId),
  }),
);

export const lessonProgress = zhiyu.table(
  'lesson_progress',
  {
    userId: uuid('user_id').notNull(),
    lessonId: uuid('lesson_id').notNull(),
    stepIndex: smallint('step_index').notNull(),
    status: text('status').notNull().default('in_progress'),
    score: numeric('score', { precision: 5, scale: 2 }).notNull().default('0'),
    attempts: integer('attempts').notNull().default(0),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('lesson_progress_user_idx').on(t.userId, t.updatedAt),
    lessonIdx: index('lesson_progress_lesson_idx').on(t.lessonId),
  }),
);

// ---- Mistake log + vocab -----------------------------------------------
export const mistakeLog = zhiyu.table(
  'mistake_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').notNull(),
    lessonId: uuid('lesson_id'),
    stepIndex: smallint('step_index'),
    questionId: text('question_id'),
    source: text('source').notNull().default('lesson'),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userRecentIdx: index('mistake_log_user_recent_idx').on(t.userId, t.createdAt),
  }),
);

export const vocabItems = zhiyu.table(
  'vocab_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    word: text('word').notNull(),
    pinyin: text('pinyin'),
    meaning: text('meaning'),
    source: text('source').notNull().default('manual'),
    hskLevel: smallint('hsk_level').notNull().default(1),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('vocab_items_user_idx').on(t.userId, t.createdAt),
  }),
);
