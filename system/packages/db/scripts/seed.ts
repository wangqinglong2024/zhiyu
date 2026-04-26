/* eslint-disable no-console */
/**
 * Master seed entrypoint. Runs each module seed in order. Idempotent.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEEDS = [
  { name: 'discover-china', file: '../seed/discover-china/seed.ts' },
  { name: 'learning', file: '../seed/learning/seed.ts' },
];

let failed = 0;
for (const s of SEEDS) {
  const abs = path.resolve(__dirname, s.file);
  console.info(`[seed:all] running ${s.name} → ${abs}`);
  const r = spawnSync('node', ['--import=tsx', abs], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`[seed:all] ${s.name} failed (code ${r.status})`);
    failed++;
  }
}
process.exit(failed === 0 ? 0 : 1);
