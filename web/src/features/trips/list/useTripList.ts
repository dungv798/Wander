import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { useEffect, useState } from 'react';
import { TRIP_LIST_STORAGE, TRIP_SEARCH_DELAY_MS } from './list.const.ts';
import { TRIP_SORTS, TRIP_STATUSES } from './tripList.ts';
import type { TripListOptions } from './tripList.ts';

export const DEFAULT_TRIP_LIST: TripListOptions = { query: '', status: null, sort: 'departure' };

/** Reads the valid options; blocked storage or broken old data uses the defaults. */
export function readTripListOptions(): TripListOptions {
  try {
    const saved = JSON.parse(PersistentStore.readRaw(TRIP_LIST_STORAGE) ?? 'null') as Partial<TripListOptions> | null;
    return {
      query: typeof saved?.query === 'string' ? saved.query : '',
      status: saved?.status && TRIP_STATUSES.includes(saved.status) ? saved.status : null,
      sort: saved?.sort && TRIP_SORTS.includes(saved.sort) ? saved.sort : DEFAULT_TRIP_LIST.sort,
    };
  } catch { return DEFAULT_TRIP_LIST; }
}

/** Remembers the choice without breaking the screen when localStorage is full or blocked. */
export function useTripList() {
  const [options, setOptions] = useState(readTripListOptions);
  const [query, setQuery] = useState(options.query);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(options.query), TRIP_SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [options.query]);
  useEffect(() => {
    try { PersistentStore.writeRaw(TRIP_LIST_STORAGE, JSON.stringify(options)); } catch { /* The filter is still used in the current session. */ }
  }, [options]);
  return { options, searchOptions: { ...options, query }, setOptions };
}
