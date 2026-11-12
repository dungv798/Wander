import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { HTTP } from '../../../shared/api/http.const.ts';
import { currentToken } from '../../../shared/state/sessionToken.ts';
import { RatingApi } from '../api/RatingApi.ts';
import type { PlaceRating } from '../model/rating.types.ts';

const ratingApi = new RatingApi();

/** The loading state: `off` = this device has no session yet (the card is not shown), `error` with the error to show an error box. */
export type RatingStatus = 'loading' | 'ready' | 'error' | 'off';

/** The result of the one-venue rating hook. */
export interface PlaceRatingState {
  readonly status: RatingStatus;
  readonly data: PlaceRating | null;
  readonly error: unknown;
  readonly busy: boolean;
  readonly reload: () => void;
  readonly save: (stars: number, comment: string) => Promise<boolean>;
  readonly remove: () => Promise<boolean>;
  readonly report: (ratingId: string) => Promise<boolean>;
}

/**
 * The Wander rating of a venue (used with `key={placeId}` so changing venue is a new state): loads on open, cancels the old request when the venue changes, and the rate/delete/report actions return `true` on success.
 * An action error is kept in `error` (the error box shows by code); with no session no network call is made.
 */
export function usePlaceRating(placeId: string): PlaceRatingState {
  const [status, setStatus] = useState<RatingStatus>(currentToken() ? 'loading' : 'off');
  const [data, setData] = useState<PlaceRating | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!currentToken()) return undefined;
    const abort = new AbortController();
    ratingApi.view(placeId, abort.signal).then((next) => { setData(next); setError(null); setStatus('ready'); }).catch((e: unknown) => {
      if (abort.signal.aborted) return;
      if (e instanceof ApiError && e.status === HTTP.UNAUTHORIZED) setStatus('off');
      else { setError(e); setStatus('error'); }
    });
    return () => abort.abort();
  }, [placeId, tick]);

  /** Runs one write action: sets `busy`, updates the data when a `PlaceRating` comes back, keeps the error to show. */
  const run = useCallback(async (action: () => Promise<PlaceRating | void>): Promise<boolean> => {
    setBusy(true);
    try {
      const next = await action();
      if (next) setData(next);
      setError(null);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const reload = useCallback(() => { setStatus('loading'); setTick((n) => n + 1); }, []);
  const save = useCallback((stars: number, comment: string) => run(() => ratingApi.rate(placeId, stars, comment)), [run, placeId]);
  const remove = useCallback(() => run(() => ratingApi.remove(placeId)), [run, placeId]);
  const report = useCallback((ratingId: string) => run(async () => {
    await ratingApi.report(placeId, ratingId);
    setData((d) => (d ? { ...d, comments: d.comments.filter((c) => c.id !== ratingId) } : d));
  }), [run, placeId]);
  return { status, data, error, busy, reload, save, remove, report };
}
