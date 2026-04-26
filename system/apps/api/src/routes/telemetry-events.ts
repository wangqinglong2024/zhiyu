/**
 * ZY-09-10 — Telemetry events sink.
 *
 * Collects buffered analytics events from the engine `GameAnalytics` reporter
 * and writes them to `zhiyu.events`. Auth is optional (anon page-views are
 * fine), but when present we attribute the row to the user.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { rawClient } from '../db.js';
import { getOptionalUser } from '../auth-mw.js';

const eventSchema = z.object({
  name: z.string().min(1).max(80),
  props: z.record(z.unknown()).optional(),
  ts: z.number().optional(),
});
const payloadSchema = z.object({ events: z.array(eventSchema).min(1).max(100) });

export async function registerTelemetryEventRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/_telemetry/event', async (req, reply) => {
    const parsed = payloadSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const user = await getOptionalUser(req);
    const userId = user?.id ?? null;

    try {
      // postgres-js handles jsonb objects natively when passed via its sql.json helper.
      for (const e of parsed.data.events) {
        await rawClient`
          INSERT INTO zhiyu.events (user_id, name, props)
          VALUES (${userId}, ${e.name}, ${rawClient.json((e.props ?? {}) as Record<string, unknown> as never)})
        `;
      }
    } catch (err) {
      req.log.warn({ err }, 'telemetry_event_insert_failed');
      reply.code(500);
      return { error: 'persist_failed' };
    }
    return { ok: true, accepted: parsed.data.events.length };
  });
}
