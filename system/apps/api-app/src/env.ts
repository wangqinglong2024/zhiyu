import { z } from 'zod';

const Schema = z.object({
  APP_ENV: z.string().default('dev'),
  API_APP_PORT: z.coerce.number().int().default(8100),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET: z.string().min(16),
  REDIS_URL: z.string().default('redis://redis:6379/0'),
  LOG_LEVEL: z.string().default('info'),
  LOGIN_LOCK_THRESHOLD: z.coerce.number().int().default(5),
  LOGIN_LOCK_WINDOW_MIN: z.coerce.number().int().default(15),
});

export type Env = z.infer<typeof Schema>;

export function loadEnv(): Env {
  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('[env] invalid environment:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
