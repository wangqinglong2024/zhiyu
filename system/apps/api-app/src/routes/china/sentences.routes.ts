// C4 · TTS 触发（按句子 ID） + AUX · 音频状态轮询
import { Hono } from 'hono';
import { z } from 'zod';
import { ChinaTtsReq } from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok } from '../../middlewares/respond.ts';
import { rateLimit } from '../../middlewares/rate-limit.ts';
import {
  getSentenceAudioState,
  requestSentenceTts,
} from '../../services/china/sentences.service.ts';

const UuidParam = z.string().uuid();

export function sentencesRoutes(env: Env) {
  const r = new Hono();

  // AUX · 状态轮询：30 次/分钟·IP
  r.get(
    '/:id/audio',
    rateLimit(env, {
      bucket: 'china_audio_poll',
      windowSec: 60,
      max: 30,
      errorCode: 'RATE_LIMITED',
      errorNumeric: 42900,
    }),
    async (c) => {
      const id = c.req.param('id');
      if (!UuidParam.safeParse(id).success) return c.json({ code: 40001, message: 'invalid id' }, 400);
      const out = await getSentenceAudioState(sb(env), id);
      return ok(c, out);
    },
  );

  // C4 · 触发 TTS：6 次/分钟·IP
  r.post(
    '/:id/tts',
    rateLimit(env, {
      bucket: 'china_tts',
      windowSec: 60,
      max: 6,
      errorCode: 'CHINA_TTS_RATE_LIMITED',
      errorNumeric: 45202,
    }),
    async (c) => {
      const id = c.req.param('id');
      if (!UuidParam.safeParse(id).success) return c.json({ code: 40001, message: 'invalid id' }, 400);
      let body: { voice?: string } = {};
      try {
        body = ChinaTtsReq.parse(await c.req.json().catch(() => ({})));
      } catch {
        body = {};
      }
      const out = await requestSentenceTts(env, sb(env), id, body.voice);
      return ok(c, out);
    },
  );

  return r;
}
