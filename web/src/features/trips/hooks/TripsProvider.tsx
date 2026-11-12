import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { useIdentity } from '../../identity/index.ts';
import { HttpTripsGateway } from '../api/HttpTripsGateway.ts';
import type { TripsGateway } from '../api/TripsGateway.ts';
import type { Trip, TripsState } from '../model/trip.types.ts';
import { mergeLoaded } from '../model/tripOrder.ts';
import { INITIAL_TRIPS_STATE } from '../model/tripState.ts';
import { clearTripsCache, loadTripsCache, saveTripsCache } from '../model/tripsCache.ts';
import { createTripsActions } from './tripsActions.ts';
import type { TripsActions } from './tripsActions.ts';

export type { TripsActions };

/** Tình trạng nạp danh sách chuyến: `loading` (đang nạp lần đầu), `ready` (đã nạp, hoặc chưa có danh tính nên chưa có chuyến), `error` (không nạp được). */
export type TripsStatus = 'loading' | 'ready' | 'error';

interface TripsContextValue {
  readonly status: TripsStatus;
  readonly state: TripsState;
  readonly actions: TripsActions;
  /** Chuyến theo mã; undefined nếu không có. */
  readonly trip: (id: string | null) => Trip | undefined;
  /** Mili giây từ epoch của bản chỉ đọc đang hiện khi máy chủ không trả lời; null khi dữ liệu là bản mới nhất từ máy chủ (B-09). */
  readonly staleSince: number | null;
  /** Nạp lại mọi chuyến từ máy chủ (nút "Thử lại"). */
  readonly reload: () => void;
}

const TripsContext = createContext<TripsContextValue | null>(null);

/** Khóa nội bộ của kho trong bộ nhớ (không ghi ra localStorage). */
const TRIPS_STORE_KEY = 'trips.server';

/** Kết quả nạp danh sách: `idle` chưa nạp, `ok`, `failed`; gắn với `round` để bỏ kết quả của lần nạp cũ. `staleAt`: khi nạp hỏng mà có bản chỉ đọc thì là thời điểm lưu bản đó. */
interface LoadState {
  readonly round: number;
  readonly result: 'idle' | 'ok' | 'failed';
  readonly staleAt: number | null;
}

/**
 * Cấp kho chuyến đi cho cây giao diện. MÁY CHỦ là nguồn sự thật: kho trong bộ nhớ chỉ là bản đọc lại, nạp khi danh tính sẵn sàng và sau mỗi
 * thao tác. Phải nằm trong `IdentityProvider`. Chưa có danh tính (hoặc hết phiên) thì không có chuyến nào.
 */
export function TripsProvider({ children, gateway }: { readonly children: ReactNode; readonly gateway?: TripsGateway }) {
  const [store] = useState(() => new PersistentStore<TripsState>(TRIPS_STORE_KEY, INITIAL_TRIPS_STATE, () => null, null));
  const [defaultGateway] = useState<TripsGateway>(() => new HttpTripsGateway(apiClient));
  const api = gateway ?? defaultGateway;
  const state = useStore(store);
  const { status: identityStatus, actions: identityActions } = useIdentity();
  const [round, setRound] = useState(0);
  const [load, setLoad] = useState<LoadState>({ round: -1, result: 'idle', staleAt: null });
  const ready = identityStatus === 'ready';
  // danh tính vào/ra trạng thái sẵn sàng (hết phiên, khôi phục, ghép máy): kết quả nạp cũ không còn đúng, nạp lại
  const [prevReady, setPrevReady] = useState(ready);
  if (prevReady !== ready) {
    setPrevReady(ready);
    setRound((r) => r + 1);
  }

  useEffect(() => {
    if (!ready) {
      // không kiểm tra được phiên vì máy chủ không trả lời: hiện bản chỉ đọc nếu có (nhãn ở `staleSince`), khác thì màn trống như cũ
      const kept = identityStatus === 'error' ? loadTripsCache() : null;
      store.update(() => (kept ? { trips: kept.trips } : INITIAL_TRIPS_STATE));
      // chỉ xóa khi chắc chắn không còn phiên (chưa có danh tính, hết phiên): lúc đang kiểm tra phiên khi mở trang ('loading') hoặc kiểm tra lỗi ('error') thì giữ bản chỉ đọc
      if (identityStatus === 'anonymous' || identityStatus === 'expired') clearTripsCache(); // chuyến của danh tính cũ không được hiện lại
      return undefined;
    }
    let live = true;
    const started = store.getSnapshot();
    api.loadAll().then((trips) => {
      if (!live) return;
      // thao tác ghi xen giữa lúc nạp: chuyến đã được đọc lại sau đó giữ bản mới, chuyến mới tạo không mất
      store.update((cur) => ({ trips: mergeLoaded(started, cur, trips) }));
      setLoad({ round, result: 'ok', staleAt: null });
    }).catch(() => {
      if (!live) return;
      // máy chủ không trả lời: nếu có bản chỉ đọc lần nạp thành công trước thì hiện nó (kèm nhãn), không để màn trống
      const cached = loadTripsCache();
      if (cached) store.update(() => ({ trips: cached.trips }));
      setLoad({ round, result: 'failed', staleAt: cached ? cached.savedAt : null });
    });
    return () => {
      live = false;
    };
  }, [ready, identityStatus, api, store, round]);

  // bản chỉ đọc luôn là lần nạp thành công gần nhất; không ghi khi đang hiện bản cũ (nếu không mốc "đã lưu lúc" bị làm mới giả)
  const fresh = ready && load.round === round && load.result === 'ok';
  useEffect(() => {
    if (fresh) saveTripsCache(state.trips, Date.now());
  }, [fresh, state.trips]);

  const actions = useMemo(() => createTripsActions({ gateway: api, store }), [api, store]);
  const reload = useCallback(() => {
    if (identityStatus === 'error') void identityActions.refresh(); // chưa qua được bước kiểm tra phiên: hỏi lại danh tính trước
    setRound((r) => r + 1);
  }, [identityStatus, identityActions]);
  const settled = ready && load.round === round;
  const identityStale = useMemo(() => (identityStatus === 'error' ? loadTripsCache()?.savedAt ?? null : null), [identityStatus]);
  const staleSince = identityStale ?? (settled && load.result === 'failed' ? load.staleAt : null);
  const status: TripsStatus = identityStatus === 'error' ? (identityStale === null ? 'error' : 'ready') : identityStatus === 'loading' ? 'loading' : !ready ? 'ready' : load.round !== round ? 'loading' : load.result === 'failed' && staleSince === null ? 'error' : 'ready';
  const value = useMemo<TripsContextValue>(() => ({ status, state, actions, trip: (id) => state.trips.find((t) => t.id === id), staleSince, reload }), [status, state, actions, staleSince, reload]);
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

/** Truy cập kho chuyến đi; ném lỗi nếu quên bọc `TripsProvider`. */
export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips phải nằm trong TripsProvider');
  return ctx;
}
