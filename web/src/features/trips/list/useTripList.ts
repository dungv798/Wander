import { useEffect, useState } from 'react';
import { TRIP_LIST_STORAGE, TRIP_SEARCH_DELAY_MS } from './list.const.ts';
import { TRIP_SORTS, TRIP_STATUSES } from './tripList.ts';
import type { TripListOptions } from './tripList.ts';

export const DEFAULT_TRIP_LIST: TripListOptions = { query: '', status: null, sort: 'departure' };

/** Đọc tùy chọn hợp lệ; bộ nhớ bị chặn hoặc dữ liệu cũ hỏng thì dùng mặc định. */
export function readTripListOptions(): TripListOptions {
  try {
    const saved = JSON.parse(localStorage.getItem(TRIP_LIST_STORAGE) ?? 'null') as Partial<TripListOptions> | null;
    return {
      query: typeof saved?.query === 'string' ? saved.query : '',
      status: saved?.status && TRIP_STATUSES.includes(saved.status) ? saved.status : null,
      sort: saved?.sort && TRIP_SORTS.includes(saved.sort) ? saved.sort : DEFAULT_TRIP_LIST.sort,
    };
  } catch { return DEFAULT_TRIP_LIST; }
}

/** Nhớ lựa chọn mà không làm hỏng màn hình khi localStorage đầy hoặc bị chặn. */
export function useTripList() {
  const [options, setOptions] = useState(readTripListOptions);
  const [query, setQuery] = useState(options.query);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(options.query), TRIP_SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [options.query]);
  useEffect(() => {
    try { localStorage.setItem(TRIP_LIST_STORAGE, JSON.stringify(options)); } catch { /* Vẫn dùng bộ lọc trong phiên hiện tại. */ }
  }, [options]);
  return { options, searchOptions: { ...options, query }, setOptions };
}
