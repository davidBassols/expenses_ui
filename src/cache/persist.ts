import type { QueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'expenses.queryCache.v1';
/** Cached data older than this is discarded instead of being shown. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const WRITE_DEBOUNCE_MS = 500;

interface PersistedEntry {
  key: readonly unknown[];
  data: unknown;
  updatedAt: number;
}

/** `year-month` for the previous, current and next month relative to today. */
function persistableMonths(): Set<string> {
  const now = new Date();
  const months = new Set<string>();
  for (const offset of [-1, 0, 1]) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    months.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
  }
  return months;
}

/**
 * Only the data needed to paint the expenses screen offline: the three months
 * around today plus the lookups and the totals shown in the top-right corner.
 */
function shouldPersist(key: readonly unknown[], months: Set<string>): boolean {
  const [name, ...rest] = key;
  if (name === 'categories' || name === 'tags' || name === 'overview') return true;
  if (name === 'expenses') return months.has(`${rest[0]}-${rest[1]}`);
  return false;
}

function read(): PersistedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersistedEntry[]) : [];
  } catch {
    return [];
  }
}

/** Seeds the cache from localStorage; the queries still refetch and overwrite this. */
export function hydrateQueryCache(queryClient: QueryClient): void {
  const months = persistableMonths();
  const now = Date.now();
  for (const entry of read()) {
    if (!Array.isArray(entry?.key) || entry.data === undefined) continue;
    if (now - entry.updatedAt > MAX_AGE_MS) continue;
    if (!shouldPersist(entry.key, months)) continue;
    queryClient.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
  }
}

/** Mirrors the relevant part of the cache into localStorage on every change. */
export function persistQueryCache(queryClient: QueryClient): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const write = () => {
    const months = persistableMonths();
    const entries: PersistedEntry[] = [];
    for (const query of queryClient.getQueryCache().getAll()) {
      if (query.state.status !== 'success' || query.state.data === undefined) continue;
      if (!shouldPersist(query.queryKey, months)) continue;
      entries.push({
        key: query.queryKey,
        data: query.state.data,
        updatedAt: query.state.dataUpdatedAt,
      });
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage full or unavailable — the app works fine without the offline copy.
    }
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(write, WRITE_DEBOUNCE_MS);
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

export function clearPersistedQueryCache(): void {
  localStorage.removeItem(STORAGE_KEY);
}
