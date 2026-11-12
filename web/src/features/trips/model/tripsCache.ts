import { STORAGE } from '../../../shared/const/app.const.ts';
import type { Trip } from './trip.types.ts';

/** The read-only copy of the trip list of the most recent successful load, to view when the server does not answer (B-09, DR-037). */
export interface TripsCache {
  readonly trips: readonly Trip[];
  /** The time it was saved, milliseconds since the epoch. */
  readonly savedAt: number;
}

/** The part of `Storage` that the cache uses. */
export type CacheStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The browser's default store; null when blocked (private mode, storage disabled). */
function browserStorage(): CacheStorage | null {
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

/** An element of the saved copy has the minimal trip shape (id, name, item list) for the UI to use without breaking. */
function looksLikeTrip(v: unknown): v is Trip {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string' && Array.isArray(v['items']);
}

/**
 * Writes the read-only copy of the trips. Running out of quota or no store is ignored silently (the saved copy is only a convenience and must never break the main flow).
 * An empty list is still written so an old copy does not come back to life after the user deletes every trip.
 */
export function saveTripsCache(trips: readonly Trip[], now: number, storage: CacheStorage | null = browserStorage()): void {
  try {
    storage?.setItem(STORAGE.TRIPS_CACHE, JSON.stringify({ savedAt: now, trips }));
  } catch {
    /* out of quota or the store is blocked: not saved */
  }
}

/** Reads the read-only copy; null if there is none, it is broken or wrongly shaped (a broken copy is deleted so it is not read again next time). */
export function loadTripsCache(storage: CacheStorage | null = browserStorage()): TripsCache | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE.TRIPS_CACHE);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && typeof parsed['savedAt'] === 'number' && Number.isFinite(parsed['savedAt']) && Array.isArray(parsed['trips']) && parsed['trips'].every(looksLikeTrip)) {
      return { trips: parsed['trips'], savedAt: parsed['savedAt'] };
    }
  } catch {
    /* broken JSON: fall through to cleanup */
  }
  clearTripsCache(storage);
  return null;
}

/** Deletes the read-only copy (when the session ends, recovery or an identity change: another person's trips must not be shown). */
export function clearTripsCache(storage: CacheStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE.TRIPS_CACHE);
  } catch {
    /* ignore */
  }
}
