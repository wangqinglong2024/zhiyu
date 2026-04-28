// I1 · TTS 内部回调挂载
import type { Hono } from 'hono';
import type { Env } from '../../env.ts';
import { ttsCallbackRoutes } from './tts-callback.routes.ts';

export function mountInternalRoutes(app: Hono, env: Env): void {
  app.route('/internal/v1/china/tts', ttsCallbackRoutes(env));
}
