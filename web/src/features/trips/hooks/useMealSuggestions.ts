import { useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { PoiApi } from '../api/poi.api.ts';
import type { PoiSuggestion } from '../api/poi.api.ts';
import type { MealAnchor } from '../model/mealSuggest.ts';
import { MEAL_SUGGEST_COPY as C } from '../model/mealSuggest.copy.ts';

type Result = { readonly status: 'loading' } | { readonly status: 'error'; readonly message: string } | { readonly status: 'ready'; readonly poi: readonly PoiSuggestion[] };
const api = new PoiApi();

/** Chỉ tải khi tờ được dựng và có mốc; hủy cả fetch/đọc thân khi đóng, đổi loại hoặc bán kính. */
export function useMealSuggestions(destination: string, kind: 'food' | 'cafe', anchor: MealAnchor | null, radius: number) {
  const [result, setResult] = useState<Result>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const lat = anchor?.lat;
  const lon = anchor?.lon;
  const requestKey = `${destination}:${kind}:${lat}:${lon}:${radius}:${attempt}`;
  const [resolvedKey, setResolvedKey] = useState('');
  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    const controller = new AbortController();
    api.nearby(destination, kind, { lat, lon }, radius, controller.signal).then(poi => {
      if (!controller.signal.aborted) { setResult({ status: 'ready', poi }); setResolvedKey(requestKey); }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) { setResult({ status: 'error', message: error instanceof ApiError && error.code === 'RATE_LIMITED' ? C.rateLimited : C.error }); setResolvedKey(requestKey); }
    });
    return () => controller.abort();
  }, [destination, kind, lat, lon, radius, attempt, requestKey]);
  /** Xóa danh sách cũ ngay khi người dùng thử lại. */
  const retry = (): void => { setResult({ status: 'loading' }); setAttempt(n => n + 1); };
  return { result: resolvedKey === requestKey ? result : { status: 'loading' } as Result, retry };
}
