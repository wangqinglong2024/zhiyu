import { sql } from 'drizzle-orm';
import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { zhiyu } from './schema.js';

export const notifications = zhiyu.table(
  'notifications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    type: text('type').notNull(),
    titleKey: text('title_key').notNull(),
    bodyKey: text('body_key'),
    data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('notifications_user_created_idx').on(t.userId, t.createdAt),
  }),
);

export type NotificationType = 'system' | 'learning' | 'order' | 'cs' | 'referral';
