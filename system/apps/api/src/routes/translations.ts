import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, asc, eq, sql as dsql } from 'drizzle-orm';
import { contentTranslations } from '@zhiyu/db';
import {
  CONTENT_LOCALES,
  FALLBACK_CONTENT_LOCALE,
  pickUiLocale,
  type ContentLocale,
} from '@zhiyu/i18n';
import { db } from '../db.js';
import { requireAdminUser } from '../auth-mw.js';

/**
 * In-memory LRU-ish cache keyed by `${type}|${id}|${locale}`.
 * Intentionally small (1000 entries, 60s TTL) — admin writes invalidate by
 * direct deletion (no cluster-wide pub/sub yet).
 */
type CacheEntry = { value: Record<string, string>; expiresAt: number };
const CACHE_MAX = 1000;
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): Record<string, string> | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  // refresh LRU position
  cache.delete(key);
  cache.set(key, hit);
  return hit.value;
}

function cacheSet(key: string, value: Record<string, string>): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cacheInvalidateEntity(type: string, id: string): void {
  const prefix = `${type}|${id}|`;
  for (const k of Array.from(cache.keys())) if (k.startsWith(prefix)) cache.delete(k);
}

const TYPE_RE = /^[a-z][a-z0-9_]{0,40}$/;
const ID_RE = /^[A-Za-z0-9_:.-]{1,100}$/;
const FIELD_RE = /^[a-z][a-z0-9_]{0,79}$/;

function assertType(value: string): boolean {
  return TYPE_RE.test(value);
}

function assertId(value: string): boolean {
  return ID_RE.test(value);
}

const upsertSchema = z.object({
  entity_type: z.string().regex(TYPE_RE),
  entity_id: z.string().regex(ID_RE),
  locale: z.enum(CONTENT_LOCALES as unknown as [string, ...string[]]),
  fields: z.record(z.string().regex(FIELD_RE), z.string().max(8000)),
});

const deleteSchema = z.object({
  entity_type: z.string().regex(TYPE_RE),
  entity_id: z.string().regex(ID_RE),
  locale: z.enum(CONTENT_LOCALES as unknown as [string, ...string[]]).optional(),
  field: z.string().regex(FIELD_RE).optional(),
});

export async function registerTranslationRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Public read: collapses rows for `locale → field: value`.
   * Falls back en/zh-CN as last resort, never returns null fields.
   */
  app.get('/api/v1/content/:type/:id', async (req, reply) => {
    const params = req.params as { type: string; id: string };
    if (!assertType(params.type) || !assertId(params.id)) {
      reply.code(400);
      return { error: 'invalid_params' };
    }
    const q = req.query as { lang?: string };
    const requested: ContentLocale = (CONTENT_LOCALES as readonly string[]).includes(q.lang ?? '')
      ? (q.lang as ContentLocale)
      : pickUiLocale(q.lang ?? null);

    const cacheKey = `${params.type}|${params.id}|${requested}`;
    const cached = cacheGet(cacheKey);
    if (cached) return { entity_type: params.type, entity_id: params.id, locale: requested, fields: cached, source: 'cache' };

    const rows = await db
      .select({ locale: contentTranslations.locale, field: contentTranslations.field, value: contentTranslations.value })
      .from(contentTranslations)
      .where(and(eq(contentTranslations.entityType, params.type), eq(contentTranslations.entityId, params.id)))
      .orderBy(asc(contentTranslations.locale), asc(contentTranslations.field));

    const byLocale: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      const bag = byLocale[r.locale] ?? (byLocale[r.locale] = {});
      bag[r.field] = r.value;
    }

    const fallbackChain: ContentLocale[] = Array.from(
      new Set<ContentLocale>([requested, FALLBACK_CONTENT_LOCALE, 'zh-CN' as ContentLocale]),
    );
    const merged: Record<string, string> = {};
    for (const lng of [...fallbackChain].reverse()) {
      const bag = byLocale[lng];
      if (bag) for (const [k, v] of Object.entries(bag)) merged[k] = v;
    }

    cacheSet(cacheKey, merged);
    return {
      entity_type: params.type,
      entity_id: params.id,
      locale: requested,
      fields: merged,
      source: 'db',
      available_locales: Object.keys(byLocale),
    };
  });

  /** Admin: list raw rows for an entity. */
  app.get('/api/v1/admin/translations', async (req, reply) => {
    const user = await requireAdminUser(req, reply);
    if (!user) return;
    const q = req.query as { type?: string; id?: string };
    if (!q.type || !assertType(q.type) || !q.id || !assertId(q.id)) {
      reply.code(400);
      return { error: 'invalid_params' };
    }
    const rows = await db
      .select()
      .from(contentTranslations)
      .where(and(eq(contentTranslations.entityType, q.type), eq(contentTranslations.entityId, q.id)))
      .orderBy(asc(contentTranslations.locale), asc(contentTranslations.field));
    return { rows };
  });

  /** Admin: upsert all fields for one (type, id, locale). */
  app.put('/api/v1/admin/translations', async (req, reply) => {
    const user = await requireAdminUser(req, reply);
    if (!user) return;
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const { entity_type, entity_id, locale, fields } = parsed.data;
    if (Object.keys(fields).length === 0) {
      reply.code(400);
      return { error: 'fields_required' };
    }
    const values = Object.entries(fields).map(([field, value]) => ({
      entityType: entity_type,
      entityId: entity_id,
      locale,
      field,
      value,
      updatedAt: new Date(),
    }));
    await db
      .insert(contentTranslations)
      .values(values)
      .onConflictDoUpdate({
        target: [
          contentTranslations.entityType,
          contentTranslations.entityId,
          contentTranslations.locale,
          contentTranslations.field,
        ],
        set: { value: dsql`excluded.value`, updatedAt: dsql`now()` },
      });
    cacheInvalidateEntity(entity_type, entity_id);
    return { ok: true, written: values.length };
  });

  /** Admin: delete by (type,id) optionally narrowed by (locale[,field]). */
  app.delete('/api/v1/admin/translations', async (req, reply) => {
    const user = await requireAdminUser(req, reply);
    if (!user) return;
    const parsed = deleteSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const filters = [
      eq(contentTranslations.entityType, parsed.data.entity_type),
      eq(contentTranslations.entityId, parsed.data.entity_id),
    ];
    if (parsed.data.locale) filters.push(eq(contentTranslations.locale, parsed.data.locale));
    if (parsed.data.field) filters.push(eq(contentTranslations.field, parsed.data.field));
    const result = await db.delete(contentTranslations).where(and(...filters));
    cacheInvalidateEntity(parsed.data.entity_type, parsed.data.entity_id);
    return { ok: true, deleted: (result as { rowCount?: number }).rowCount ?? null };
  });

  /** Admin: per (entity_type, locale) coverage counts. */
  app.get('/api/v1/admin/translations/coverage', async (req, reply) => {
    const user = await requireAdminUser(req, reply);
    if (!user) return;
    const rows = await db
      .select({
        entityType: contentTranslations.entityType,
        locale: contentTranslations.locale,
        rows: dsql<number>`count(*)::int`,
        entities: dsql<number>`count(distinct ${contentTranslations.entityId})::int`,
      })
      .from(contentTranslations)
      .groupBy(contentTranslations.entityType, contentTranslations.locale)
      .orderBy(asc(contentTranslations.entityType), asc(contentTranslations.locale));
    return { rows };
  });
}
