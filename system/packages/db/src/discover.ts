/**
 * E06 — Discover China content schema (drizzle bindings).
 * Mirrors apps/api/drizzle/migrations/0005_e06_discover_china.sql.
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
  pgTable,
} from 'drizzle-orm/pg-core';
import { zhiyu } from './schema.js';

export const categories = zhiyu.table(
  'categories',
  {
    id: smallint('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    emoji: text('emoji'),
    coverUrl: text('cover_url'),
    i18nName: jsonb('i18n_name').notNull().default(sql`'{}'::jsonb`),
    i18nSummary: jsonb('i18n_summary').notNull().default(sql`'{}'::jsonb`),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ sortIdx: index('categories_sort_idx').on(t.sortOrder) }),
);

export const articles = zhiyu.table(
  'articles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: text('slug').notNull().unique(),
    categoryId: smallint('category_id').notNull(),
    hskLevel: smallint('hsk_level').notNull().default(1),
    status: text('status').notNull().default('draft'),
    coverUrl: text('cover_url'),
    estimatedMinutes: smallint('estimated_minutes').notNull().default(5),
    i18nTitle: jsonb('i18n_title').notNull().default(sql`'{}'::jsonb`),
    i18nSummary: jsonb('i18n_summary').notNull().default(sql`'{}'::jsonb`),
    bodyMd: text('body_md').notNull().default(''),
    audioVoice: text('audio_voice').notNull().default('female-1'),
    author: text('author'),
    views: integer('views').notNull().default(0),
    likes: integer('likes').notNull().default(0),
    ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).notNull().default('0'),
    ratingCount: integer('rating_count').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    catIdx: index('articles_category_idx').on(t.categoryId, t.hskLevel, t.publishedAt),
    statusIdx: index('articles_status_idx').on(t.status, t.publishedAt),
  }),
);

export const sentences = zhiyu.table(
  'sentences',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    articleId: uuid('article_id').notNull(),
    idx: smallint('idx').notNull(),
    zh: text('zh').notNull(),
    pinyin: text('pinyin'),
    i18nTranslation: jsonb('i18n_translation').notNull().default(sql`'{}'::jsonb`),
    audioUrl: text('audio_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    artIdx: index('sentences_article_idx').on(t.articleId, t.idx),
    artUk: uniqueIndex('sentences_article_idx_uk').on(t.articleId, t.idx),
  }),
);

export const charDict = zhiyu.table('char_dict', {
  ch: text('ch').primaryKey(),
  pinyin: text('pinyin'),
  i18nGloss: jsonb('i18n_gloss').notNull().default(sql`'{}'::jsonb`),
  examples: jsonb('examples').notNull().default(sql`'[]'::jsonb`),
  audioUrl: text('audio_url'),
  hskLevel: smallint('hsk_level'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const favorites = zhiyu.table(
  'favorites',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uk: uniqueIndex('favorites_uk').on(t.userId, t.entityType, t.entityId),
    userIdx: index('favorites_user_idx').on(t.userId, t.createdAt),
  }),
);

export const notes = zhiyu.table(
  'notes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    body: text('body').notNull().default(''),
    color: text('color').notNull().default('amber'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('notes_user_idx').on(t.userId, t.updatedAt),
    targetIdx: index('notes_target_idx').on(t.targetType, t.targetId),
  }),
);

export const readingProgress = zhiyu.table('reading_progress', {
  userId: uuid('user_id').notNull(),
  articleId: uuid('article_id').notNull(),
  lastSentenceIdx: smallint('last_sentence_idx').notNull().default(0),
  scrollPct: numeric('scroll_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  accumulatedSeconds: integer('accumulated_seconds').notNull().default(0),
  completed: boolean('completed').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

export const articleRatings = zhiyu.table('article_ratings', {
  userId: uuid('user_id').notNull(),
  articleId: uuid('article_id').notNull(),
  score: smallint('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Re-export pgTable helper if needed downstream
export { pgTable };
