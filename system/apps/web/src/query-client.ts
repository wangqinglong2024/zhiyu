/**
 * ZY-05-02 — Shared QueryClient with IndexedDB persister.
 *
 * Uses idb-keyval so we don't pull a full ORM. The persister wraps it in the
 * AsyncStorage interface @tanstack/query-async-storage-persister expects. On
 * first hydrate we drop entries older than 24h to avoid stale auth-bound data.
 */
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const idbStorage = {
  getItem: async (key: string): Promise<string | null> => (await idbGet<string>(key)) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    await idbSet(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await idbDel(key);
  },
};

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: 'zhiyu-query-cache',
  throttleTime: 1000,
});
