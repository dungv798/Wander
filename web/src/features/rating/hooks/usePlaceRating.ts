import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { HTTP } from '../../../shared/api/http.const.ts';
import { currentToken } from '../../../shared/state/sessionToken.ts';
import { RatingApi } from '../api/RatingApi.ts';
import type { PlaceRating } from '../model/rating.types.ts';

const ratingApi = new RatingApi();

/** Trạng thái tải: `off` = máy này chưa có phiên (không hiện thẻ), `error` kèm lỗi để hiện hộp lỗi. */
export type RatingStatus = 'loading' | 'ready' | 'error' | 'off';

/** Kết quả của hook rating một quán. */
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
 * Rating Wander của một quán (dùng với `key={placeId}` để đổi quán là trạng thái mới): tải khi mở, hủy yêu cầu cũ khi đổi quán, và các thao tác chấm/xóa/báo cáo trả `true` khi thành công.
 * Lỗi thao tác được giữ ở `error` (hộp lỗi hiện theo mã); thiếu phiên thì không gọi mạng.
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

  /** Chạy một thao tác ghi: đặt `busy`, cập nhật dữ liệu khi trả về `PlaceRating`, giữ lỗi để hiện. */
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
