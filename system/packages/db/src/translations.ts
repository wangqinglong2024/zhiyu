import { primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { zhiyu } from './schema.js';

export const contentTranslations = zhiyu.table(
  'content_translations',
  {
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    locale: text('locale').notNull(),
    field: text('field').notNull(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.entityType, t.entityId, t.locale, t.field] }),
  }),
);
