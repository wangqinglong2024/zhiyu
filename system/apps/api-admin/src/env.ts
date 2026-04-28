import { z } from 'zod';

const Schema = z.object({
  APP_ENV: z.string().default('dev'),
  API_ADMIN_PORT: z.coerce.number().int().default(9100),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET: z.string().min(16),
  SUPER_ADMIN_EMAIL: z.string().email(),
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
