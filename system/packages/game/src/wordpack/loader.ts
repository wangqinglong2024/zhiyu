/**
 * WordPackLoader (ZY-09-08)
 *
 * Fetches a wordpack JSON from `/api/v1/wordpacks/:id`, validates the shape,
 * caches in-memory, and indexes by char + by HSK level so games can sample.
 *
 * Source schema (sync with backend):
 *   { id, hsk_level, items:[ { char, pinyin, gloss_i18n, audio_id } ] }
 */
export interface WordPackItem {
  char: string;
  pinyin: string;
  gloss_i18n?: Record<string, string>;
  audio_id?: string;
}

export interface WordPack {
  id: string;
  hsk_level: number;
  items: WordPackItem[];
}

export interface WordPackLoaderOptions {
  fetcher?: typeof fetch;
  baseUrl?: string;
}

export class WordPackLoader {
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;
  private readonly cache = new Map<string, WordPack>();

  constructor(opts: WordPackLoaderOptions = {}) {
    this.fetcher = opts.fetcher ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = opts.baseUrl ?? '/api/v1/wordpacks';
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  get(id: string): WordPack | undefined {
    return this.cache.get(id);
  }

  async load(id: string): Promise<WordPack> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const url = `${this.baseUrl}/${encodeURIComponent(id)}`;
    const res = await this.fetcher(url);
    if (!res.ok) {
      throw new Error(`wordpack_http_${res.status}`);
    }
    const json = (await res.json()) as unknown;
    const pack = parseWordPack(json);
    this.cache.set(id, pack);
    return pack;
  }

  /** Convenience: fetch HSK level packs `hsk-1` .. `hsk-6`. */
  async loadByLevel(level: 1 | 2 | 3 | 4 | 5 | 6): Promise<WordPack> {
    return this.load(`hsk-${level}`);
  }
}

function parseWordPack(input: unknown): WordPack {
  if (!input || typeof input !== 'object') throw new Error('wordpack_invalid_root');
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== 'string') throw new Error('wordpack_missing_id');
  if (typeof obj.hsk_level !== 'number') throw new Error('wordpack_missing_level');
  if (!Array.isArray(obj.items)) throw new Error('wordpack_missing_items');
  const items: WordPackItem[] = [];
  for (const raw of obj.items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.char !== 'string' || typeof item.pinyin !== 'string') continue;
    items.push({
      char: item.char,
      pinyin: item.pinyin,
      gloss_i18n: typeof item.gloss_i18n === 'object' && item.gloss_i18n
        ? (item.gloss_i18n as Record<string, string>)
        : undefined,
      audio_id: typeof item.audio_id === 'string' ? item.audio_id : undefined,
    });
  }
  return { id: obj.id, hsk_level: obj.hsk_level, items };
}
