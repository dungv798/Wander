import { useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { PoiApi } from '../api/poi.api.ts';
import type { PoiSuggestion } from '../api/poi.api.ts';
import type { MealAnchor } from '../model/mealSuggest.ts';
import { MEAL_SUGGEST_COPY as C } from '../model/mealSuggest.copy.ts';

type Result = { readonly status: 'loading' } | { readonly status: 'error'; readonly message: string } | { readonly status: 'ready'; readonly poi: readonly PoiSuggestion[] };
const api = new PoiApi();

/** Loads only when the sheet is built and there is a landmark; cancels the fetch/body read when closed or when the kind or the radius changes. */
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
  /** Clears the old list as soon as the user retries. */
  const retry = (): void => { setResult({ status: 'loading' }); setAttempt(n => n + 1); };
  return { result: resolvedKey === requestKey ? result : { status: 'loading' } as Result, retry };
}
