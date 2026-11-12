import type { DestinationDetail } from './Catalog.types.ts';

/** The limits of the saved destination copy: the key, the number of destinations kept and the maximum size of one copy (JSON characters). */
export const DESTINATION_CACHE_LIMITS = {
  KEY: 'wander.web.catalog.destinations.v1',
  MAX_ENTRIES: 4,
  MAX_CHARS: 600_000,
} as const;

/** The part of `Storage` that the saved copy uses. */
export type DestinationStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface Entry {
  readonly id: string;
  readonly savedAt: number;
  readonly data: DestinationDetail;
}

/** The browser's default store; null when it is blocked. */
function browserStorage(): DestinationStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A destination with the minimum shape for the screens to use without breaking (the same criterion as the check when loading from the API). */
function looksLikeDetail(v: unknown): v is DestinationDetail {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string'
    && Array.isArray(v['places']) && Array.isArray(v['guide']) && Array.isArray(v['references']);
}

/** Reads the saved entries; a broken entry is dropped, a broken store counts as empty. */
function readEntries(storage: DestinationStorage | null): Entry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(DESTINATION_CACHE_LIMITS.KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    const list = isRecord(parsed) && Array.isArray(parsed['entries']) ? parsed['entries'] : [];
    return list.filter((e): e is Entry => isRecord(e) && typeof e['id'] === 'string' && typeof e['savedAt'] === 'number' && looksLikeDetail(e['data']));
  } catch {
    return [];
  }
}

/**
 * Saves the latest destination copy that could be loaded so the schedule/detail can still be viewed when the server does not answer (B-09, DR-037). Keeps a few of the newest destinations, drops a copy that is too large,
 * and stays silent when the quota runs out: this is only a convenience and must never break the main flow.
 */
export function saveCachedDestination(detail: DestinationDetail, now: number, storage: DestinationStorage | null = browserStorage()): void {
  const text = JSON.stringify({ id: detail.id, savedAt: now, data: detail });
  if (!storage || text.length > DESTINATION_CACHE_LIMITS.MAX_CHARS) return;
  const others = readEntries(storage).filter((e) => e.id !== detail.id);
  const entries = [{ id: detail.id, savedAt: now, data: detail }, ...others]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, DESTINATION_CACHE_LIMITS.MAX_ENTRIES);
  try {
    storage.setItem(DESTINATION_CACHE_LIMITS.KEY, JSON.stringify({ entries }));
  } catch {
    /* out of quota: not saved */
  }
}

/** The saved copy of a destination; null if there is none or it is broken. */
export function loadCachedDestination(id: string, storage: DestinationStorage | null = browserStorage()): DestinationDetail | null {
  return readEntries(storage).find((e) => e.id === id)?.data ?? null;
}
