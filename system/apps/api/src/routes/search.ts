import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * ZY-05-04 search endpoint.
 *
 * Returns up to 5 hits per type. v1 ships a stub backed by static fixtures so
 * the FE Command Palette has a working multi-source response while ZY-06-06
 * (Postgres FTS / jieba) is delivered in a later epic. When the FTS pipeline
 * lands we will swap the implementation in this same handler — the JSON shape
 * is the contract.
 */

const SEARCH_TYPES = ['course', 'lesson', 'article', 'novel', 'word', 'setting'] as const;
type SearchType = (typeof SEARCH_TYPES)[number];

interface SearchHit {
  id: string;
  type: SearchType;
  title: string;
  subtitle?: string;
  url: string;
}

const FIXTURES: SearchHit[] = [
  { id: 'c-hsk1', type: 'course', title: 'HSK 1 启程', subtitle: '24 lessons · 3.2k learners', url: '/courses/hsk1' },
  { id: 'c-hsk2', type: 'course', title: 'HSK 2 进阶', subtitle: '32 lessons · 1.8k learners', url: '/courses/hsk2' },
  { id: 'c-daily', type: 'course', title: '每日中文', subtitle: '7 / 14 / 21 day plans', url: '/courses/daily' },
  { id: 'l-greet', type: 'lesson', title: '你好 · Greetings', subtitle: 'HSK1 · L1', url: '/lessons/greet' },
  { id: 'l-numbers', type: 'lesson', title: '数字 1-10', subtitle: 'HSK1 · L2', url: '/lessons/numbers' },
  { id: 'a-pinyin', type: 'article', title: 'Pinyin 入门', subtitle: '4 min read', url: '/discover/pinyin' },
  { id: 'a-tones', type: 'article', title: '四声调与变调', subtitle: '6 min read', url: '/discover/tones' },
  { id: 'n-urban', type: 'novel', title: '都市烟火', subtitle: '都市言情', url: '/novels/urban' },
  { id: 'n-xianxia', type: 'novel', title: '青冥仙途', subtitle: '仙侠修真', url: '/novels/xianxia' },
  { id: 'w-ni-hao', type: 'word', title: '你好 · nǐ hǎo', subtitle: 'hello', url: '/words/ni-hao' },
  { id: 'w-xie-xie', type: 'word', title: '谢谢 · xiè xie', subtitle: 'thanks', url: '/words/xie-xie' },
  { id: 's-theme', type: 'setting', title: 'Theme', subtitle: 'Light · Dark · System', url: '/me/settings' },
  { id: 's-language', type: 'setting', title: 'Language', subtitle: 'EN · VI · TH · ID', url: '/me/settings' },
];

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  types: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? (v.split(',').map((t) => t.trim()).filter((t): t is SearchType => SEARCH_TYPES.includes(t as SearchType)))
        : (SEARCH_TYPES as readonly SearchType[]),
    ),
  limit_per_type: z.coerce.number().int().min(1).max(10).default(5),
});

function score(hit: SearchHit, q: string): number {
  const haystack = `${hit.title} ${hit.subtitle ?? ''}`.toLowerCase();
  const needle = q.toLowerCase();
  if (haystack.startsWith(needle)) return 100;
  if (haystack.includes(needle)) return 60;
  // Letter-by-letter fuzzy
  let i = 0;
  let s = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) {
      i++;
      s += 4;
      if (i >= needle.length) break;
    }
  }
  return i >= needle.length ? s : 0;
}

export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/search', async (req, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_query', issues: parsed.error.issues };
    }
    const { q, types, limit_per_type } = parsed.data;
    const buckets: Partial<Record<SearchType, SearchHit[]>> = {};
    for (const hit of FIXTURES) {
      if (!types.includes(hit.type)) continue;
      const s = score(hit, q);
      if (s <= 0) continue;
      const list = buckets[hit.type] ?? (buckets[hit.type] = []);
      list.push({ ...hit, ...({ _score: s } as Record<string, unknown>) });
    }
    const result: Record<string, SearchHit[]> = {};
    let total = 0;
    for (const t of types) {
      const list = (buckets[t] ?? [])
        .sort((a, b) => ((b as unknown as { _score: number })._score - (a as unknown as { _score: number })._score))
        .slice(0, limit_per_type)
        .map(({ ...rest }) => {
          // strip private _score before returning
          const r = rest as SearchHit & { _score?: number };
          delete r._score;
          return r;
        });
      if (list.length) {
        result[t] = list;
        total += list.length;
      }
    }
    return { q, total, types, results: result };
  });
}
