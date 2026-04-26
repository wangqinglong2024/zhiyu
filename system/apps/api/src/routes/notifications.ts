import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, isNull, sql as dsql } from 'drizzle-orm';
import { notifications, type NotificationType } from '@zhiyu/db';
import { db } from '../db.js';
import { supaAdmin } from '../supa.js';
import { requireUser } from '../auth-mw.js';

const NOTIFICATION_TYPES = ['system', 'learning', 'order', 'cs', 'referral'] as const;

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  unread: z.coerce.boolean().optional(),
});

const markReadBodySchema = z.object({
  ids: z.array(z.string().uuid()).max(100).optional(),
  all: z.boolean().optional(),
});

/**
 * Server-side helper used by other modules. Persists row + broadcasts realtime
 * payload on `notif:user:<uid>`. Falls back to no-op if realtime publish fails
 * (FE will pick the row up via the next list poll / reconnect).
 */
export async function notify(opts: {
  userId: string;
  type: NotificationType;
  titleKey: string;
  bodyKey?: string;
  data?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const inserted = await db
    .insert(notifications)
    .values({
      userId: opts.userId,
      type: opts.type,
      titleKey: opts.titleKey,
      bodyKey: opts.bodyKey ?? null,
      data: opts.data ?? {},
    })
    .returning({ id: notifications.id, createdAt: notifications.createdAt });
  const row = inserted[0];
  if (!row) throw new Error('notification_insert_failed');

  try {
    const channel = supaAdmin.channel(`notif:user:${opts.userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        id: row.id,
        type: opts.type,
        title_key: opts.titleKey,
        body_key: opts.bodyKey ?? null,
        data: opts.data ?? {},
        created_at: row.createdAt.toISOString(),
      },
    });
    await supaAdmin.removeChannel(channel);
  } catch (err) {
    // Realtime is best-effort. FE re-syncs on reconnect.
    // eslint-disable-next-line no-console
    console.warn('[notify] realtime broadcast failed', err);
  }
  return { id: row.id };
}

export async function registerNotificationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/notifications', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_query', issues: parsed.error.issues };
    }
    const { limit, type, unread } = parsed.data;
    const conds = [eq(notifications.userId, user.id)];
    if (type) conds.push(eq(notifications.type, type));
    if (unread) conds.push(isNull(notifications.readAt));
    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conds))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    const [{ unread_count } = { unread_count: 0 }] = await db
      .select({ unread_count: dsql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    return { items: rows, unread_count };
  });

  app.post('/api/v1/notifications/read', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = markReadBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const { ids, all } = parsed.data;
    if (all) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    } else if (ids?.length) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, user.id), dsql`${notifications.id} = ANY(${ids}::uuid[])`));
    }
    return { ok: true };
  });

  // Dev / mock helper: lets the FE smoke-test realtime without backend events.
  // Auth required → emits a notification to the caller's own user_id.
  app.post('/api/v1/notifications/_demo', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const out = await notify({
      userId: user.id,
      type: 'system',
      titleKey: 'notifications.demo_title',
      bodyKey: 'notifications.demo_body',
      data: { ts: Date.now() },
    });
    return out;
  });
}
