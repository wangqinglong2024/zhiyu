import { serve } from '@hono/node-server';
import { buildApp } from './app.ts';
import { loadEnv } from './env.ts';

const env = loadEnv();
const app = buildApp(env);

serve({ fetch: app.fetch, port: env.API_APP_PORT, hostname: '0.0.0.0' }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[api-app] listening on http://0.0.0.0:${info.port}`);
});
