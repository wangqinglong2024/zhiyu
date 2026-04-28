import { serve } from '@hono/node-server';
import { loadEnv } from './env.ts';
import { buildAdminApp } from './app.ts';

const env = loadEnv();
const app = buildAdminApp(env);

serve({ fetch: app.fetch, port: env.API_ADMIN_PORT, hostname: '0.0.0.0' }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[api-admin] listening on http://0.0.0.0:${info.port}`);
});
