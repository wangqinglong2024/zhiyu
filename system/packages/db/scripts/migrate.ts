import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
const allowFake = process.env.ALLOW_FAKE_DATABASE === 'true';

if (!databaseUrl) {
  if (allowFake) {
    console.warn('[db:migrate] DATABASE_URL missing, fake database mode active.');
    process.exit(0);
  }
  throw new Error('DATABASE_URL is required');
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  const dir = join(process.cwd(), 'migrations');
  const migrations = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of migrations) {
    const migration = await readFile(join(dir, file), 'utf8');
    await sql.unsafe(migration);
    console.log(JSON.stringify({ status: 'ok', migration: file.replace(/\.sql$/, '') }));
  }
} catch (error) {
  throw error;
} finally {
  await sql.end({ timeout: 1 });
}