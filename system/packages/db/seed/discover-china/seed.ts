/**
 * E06 — Discover China seed loader.
 *
 * Idempotent: upserts 12 categories and ≥36 articles (3 per category) with
 * sentence rows + i18n + char_dict primer. Run via:
 *
 *   pnpm --filter @zhiyu/db seed:discover
 *
 * Source data lives next to this script in `categories.json` and
 * `articles.json` to keep the seeder small and reviewable. Translations cover
 * en / vi / th / id / zh-CN.
 */
/* eslint-disable no-console */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { loadEnv } from '@zhiyu/config';

const env = loadEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CategorySeed {
  id: number;
  slug: string;
  emoji: string;
  cover_url?: string;
  i18n_name: Record<string, string>;
  i18n_summary: Record<string, string>;
  sort_order: number;
}

interface SentenceSeed {
  zh: string;
  pinyin?: string;
  i18n: Record<string, string>;
}

interface ArticleSeed {
  slug: string;
  category: string; // matches category.slug
  hsk_level: number;
  estimated_minutes?: number;
  cover_url?: string;
  author?: string;
  i18n_title: Record<string, string>;
  i18n_summary: Record<string, string>;
  body_md?: string;
  sentences: SentenceSeed[];
}

interface CharDictSeed {
  ch: string;
  pinyin: string;
  i18n_gloss: Record<string, string>;
  examples?: Array<{ zh: string; pinyin?: string; i18n?: Record<string, string> }>;
  hsk_level?: number;
}

async function main(): Promise<void> {
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  try {
    const cats: CategorySeed[] = JSON.parse(
      await readFile(path.join(__dirname, 'categories.json'), 'utf8'),
    );
    const arts: ArticleSeed[] = JSON.parse(
      await readFile(path.join(__dirname, 'articles.json'), 'utf8'),
    );
    const dict: CharDictSeed[] = JSON.parse(
      await readFile(path.join(__dirname, 'char-dict.json'), 'utf8'),
    );

    console.info(`[seed] categories=${cats.length} articles=${arts.length} chars=${dict.length}`);

    // Upsert categories.
    for (const c of cats) {
      await sql`
        INSERT INTO zhiyu.categories
          (id, slug, emoji, cover_url, i18n_name, i18n_summary, sort_order)
        VALUES
          (${c.id}, ${c.slug}, ${c.emoji}, ${c.cover_url ?? null},
           ${sql.json(c.i18n_name)}, ${sql.json(c.i18n_summary)}, ${c.sort_order})
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          emoji = EXCLUDED.emoji,
          cover_url = EXCLUDED.cover_url,
          i18n_name = EXCLUDED.i18n_name,
          i18n_summary = EXCLUDED.i18n_summary,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
      `;
    }

    // Map slug -> id for articles.
    const slugMap = new Map<string, number>();
    for (const c of cats) slugMap.set(c.slug, c.id);

    for (const a of arts) {
      const catId = slugMap.get(a.category);
      if (!catId) {
        console.warn(`[seed] skip article ${a.slug}: unknown category ${a.category}`);
        continue;
      }
      const [row] = await sql<{ id: string }[]>`
        INSERT INTO zhiyu.articles
          (slug, category_id, hsk_level, status, cover_url, estimated_minutes,
           i18n_title, i18n_summary, body_md, author, published_at)
        VALUES
          (${a.slug}, ${catId}, ${a.hsk_level}, 'published', ${a.cover_url ?? null},
           ${a.estimated_minutes ?? 5}, ${sql.json(a.i18n_title)},
           ${sql.json(a.i18n_summary)}, ${a.body_md ?? ''}, ${a.author ?? 'Zhiyu Editorial'},
           now())
        ON CONFLICT (slug) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          hsk_level = EXCLUDED.hsk_level,
          status = 'published',
          cover_url = EXCLUDED.cover_url,
          estimated_minutes = EXCLUDED.estimated_minutes,
          i18n_title = EXCLUDED.i18n_title,
          i18n_summary = EXCLUDED.i18n_summary,
          body_md = EXCLUDED.body_md,
          author = EXCLUDED.author,
          published_at = COALESCE(zhiyu.articles.published_at, now()),
          updated_at = now()
        RETURNING id
      `;
      const articleId = row.id;
      await sql`DELETE FROM zhiyu.sentences WHERE article_id = ${articleId}`;
      for (let i = 0; i < a.sentences.length; i++) {
        const s = a.sentences[i];
        await sql`
          INSERT INTO zhiyu.sentences
            (article_id, idx, zh, pinyin, i18n_translation)
          VALUES
            (${articleId}, ${i}, ${s.zh}, ${s.pinyin ?? null}, ${sql.json(s.i18n)})
        `;
      }
    }

    for (const d of dict) {
      await sql`
        INSERT INTO zhiyu.char_dict
          (ch, pinyin, i18n_gloss, examples, hsk_level)
        VALUES
          (${d.ch}, ${d.pinyin}, ${sql.json(d.i18n_gloss)},
           ${sql.json(d.examples ?? [])}, ${d.hsk_level ?? null})
        ON CONFLICT (ch) DO UPDATE SET
          pinyin = EXCLUDED.pinyin,
          i18n_gloss = EXCLUDED.i18n_gloss,
          examples = EXCLUDED.examples,
          hsk_level = EXCLUDED.hsk_level,
          updated_at = now()
      `;
    }

    console.info('[seed] discover-china done');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
