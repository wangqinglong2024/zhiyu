/**
 * AssetLoader (ZY-09-04)
 *
 * Loads images / spritesheets / audio / fonts / JSON in parallel, with:
 *   - per-item retry (default 2)
 *   - aggregated errors (one item failing doesn't abort the rest)
 *   - normalized progress callback (0..1, monotonic, ≥1% precision)
 *   - in-memory LRU-style cache keyed by URL
 *
 * Pixi-specific decoding is delegated through the optional `decoder` map so
 * the unit tests can exercise the loader without a WebGL context.
 */
export interface AssetManifest {
  images?: AssetEntry[];
  spritesheets?: AssetEntry[];
  audio?: AssetEntry[];
  json?: AssetEntry[];
  fonts?: AssetEntry[];
}

export interface AssetEntry {
  id: string;
  url: string;
  retries?: number;
}

export type AssetKind = 'image' | 'spritesheet' | 'audio' | 'json' | 'font';

export interface LoadedAsset {
  id: string;
  kind: AssetKind;
  url: string;
  data: unknown;
  bytes?: number;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  ratio: number;
  current?: { id: string; kind: AssetKind };
}

export interface AssetLoaderOptions {
  fetcher?: typeof fetch;
  decoder?: Partial<Record<AssetKind, (response: Response, entry: AssetEntry) => Promise<unknown>>>;
  cacheSize?: number;
}

export interface LoadResult {
  assets: Map<string, LoadedAsset>;
  errors: AssetError[];
}

export interface AssetError {
  id: string;
  url: string;
  kind: AssetKind;
  error: unknown;
}

const DEFAULT_RETRIES = 2;
const DEFAULT_CACHE_SIZE = 256;

export class AssetLoader {
  private readonly cache = new Map<string, LoadedAsset>();
  private readonly fetcher: typeof fetch;
  private readonly decoders: Required<NonNullable<AssetLoaderOptions['decoder']>>;
  private readonly cacheSize: number;

  constructor(opts: AssetLoaderOptions = {}) {
    this.fetcher = opts.fetcher ?? globalThis.fetch.bind(globalThis);
    this.cacheSize = opts.cacheSize ?? DEFAULT_CACHE_SIZE;
    this.decoders = {
      image: opts.decoder?.image ?? defaultBlobDecoder,
      spritesheet: opts.decoder?.spritesheet ?? defaultJsonDecoder,
      audio: opts.decoder?.audio ?? defaultBlobDecoder,
      json: opts.decoder?.json ?? defaultJsonDecoder,
      font: opts.decoder?.font ?? defaultBlobDecoder,
    };
  }

  /** Read-through cache for repeated `add()`. */
  get(id: string): LoadedAsset | undefined {
    return this.cache.get(id);
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Preload everything in the manifest. Resolves with successful assets +
   * an aggregated error list. Never rejects.
   */
  async preload(manifest: AssetManifest, onProgress?: (e: ProgressEvent) => void): Promise<LoadResult> {
    const flat = flattenManifest(manifest);
    const total = flat.length;
    const result: LoadResult = { assets: new Map(), errors: [] };
    if (total === 0) {
      onProgress?.({ loaded: 0, total: 0, ratio: 1 });
      return result;
    }
    let loaded = 0;
    const tasks = flat.map(async ({ kind, entry }) => {
      try {
        const asset = await this._loadOne(kind, entry);
        result.assets.set(entry.id, asset);
        this._cachePut(asset);
      } catch (err) {
        result.errors.push({ id: entry.id, url: entry.url, kind, error: err });
      } finally {
        loaded += 1;
        onProgress?.({
          loaded,
          total,
          ratio: loaded / total,
          current: { id: entry.id, kind },
        });
      }
    });
    await Promise.all(tasks);
    return result;
  }

  private async _loadOne(kind: AssetKind, entry: AssetEntry): Promise<LoadedAsset> {
    const cached = this.cache.get(entry.id);
    if (cached) return cached;
    const retries = Math.max(0, entry.retries ?? DEFAULT_RETRIES);
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const res = await this.fetcher(entry.url);
        if (!res.ok) {
          throw new Error(`http_${res.status}`);
        }
        const data = await this.decoders[kind](res, entry);
        return { id: entry.id, url: entry.url, kind, data };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error('asset_load_failed');
  }

  private _cachePut(asset: LoadedAsset): void {
    if (this.cache.size >= this.cacheSize) {
      // Drop the oldest insertion-order key — Map iteration is insertion order.
      const firstKey = this.cache.keys().next().value;
      if (typeof firstKey === 'string') this.cache.delete(firstKey);
    }
    this.cache.set(asset.id, asset);
  }
}

function flattenManifest(m: AssetManifest): { kind: AssetKind; entry: AssetEntry }[] {
  const out: { kind: AssetKind; entry: AssetEntry }[] = [];
  for (const e of m.images ?? []) out.push({ kind: 'image', entry: e });
  for (const e of m.spritesheets ?? []) out.push({ kind: 'spritesheet', entry: e });
  for (const e of m.audio ?? []) out.push({ kind: 'audio', entry: e });
  for (const e of m.json ?? []) out.push({ kind: 'json', entry: e });
  for (const e of m.fonts ?? []) out.push({ kind: 'font', entry: e });
  return out;
}

async function defaultBlobDecoder(res: Response): Promise<Blob> {
  return res.blob();
}

async function defaultJsonDecoder(res: Response): Promise<unknown> {
  return res.json();
}
