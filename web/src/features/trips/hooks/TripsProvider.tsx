import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { Trip, TripItem, TripsState } from '../model/trip.types.ts';
import { sanitizeTripsState } from '../model/tripSanitize.ts';
import * as T from '../model/tripState.ts';
import * as Trash from '../model/tripTrash.ts';
import type { DayPlan, EditResult, ItemPatch, NewTrip, PlaceRef, TripEdit } from '../model/tripState.ts';

/** Các thao tác trên kho chuyến đi (mỗi thao tác là một hàm thuần ở `tripState.ts`). Bản backend thật (FE-10) thay phần cài đặt, giữ hợp đồng này. */
export interface TripsActions {
  readonly create: (n: NewTrip, places: readonly PlaceRef[]) => Trip;
  readonly addPlaces: (tripId: string, places: readonly PlaceRef[]) => void;
  readonly addItem: (tripId: string, item: TripItem) => void;
  readonly updateItem: (tripId: string, itemId: string, patch: ItemPatch) => void;
  readonly assignDay: (tripId: string, itemId: string, day: string | null) => void;
  readonly moveItem: (tripId: string, itemId: string, dir: 'up' | 'down') => void;
  readonly toggleDone: (tripId: string, itemId: string) => void;
  readonly applyPlan: (tripId: string, plan: DayPlan) => void;
  readonly editTrip: (tripId: string, e: TripEdit) => EditResult | null;
  /** Xóa mềm một mục (vào "Đã xóa gần đây"). */
  readonly trashItem: (tripId: string, itemId: string) => void;
  /** Khôi phục một mục từ thùng rác; trả `dayLost` (ngày cũ không còn nên về Chưa có ngày) hoặc null nếu không có mục. */
  readonly restoreItem: (tripId: string, entryId: string) => { readonly dayLost: boolean } | null;
  /** Xóa vĩnh viễn một mục khỏi thùng rác (không hoàn tác được). */
  readonly purgeItem: (tripId: string, entryId: string) => void;
  /** Đặt lại nguyên một chuyến về ảnh chụp đã lưu (dùng cho Hoàn tác). */
  readonly restore: (snapshot: Trip) => void;
  /** Chuyến hiện tại theo mã (đọc thẳng kho, không qua render); dùng để so sánh khi Hoàn tác. */
  readonly current: (tripId: string) => Trip | undefined;
}

interface TripsContextValue {
  readonly state: TripsState;
  readonly actions: TripsActions;
  /** Chuyến theo mã; undefined nếu không có. */
  readonly trip: (id: string | null) => Trip | undefined;
}

const TripsContext = createContext<TripsContextValue | null>(null);

/** Cấp kho chuyến đi (lưu cục bộ, làm sạch khi đọc) cho cây giao diện. */
export function TripsProvider({ children, store }: { readonly children: ReactNode; readonly store?: PersistentStore<TripsState> }) {
  const [created] = useState(() => new PersistentStore<TripsState>(STORAGE.TRIPS, T.INITIAL_TRIPS_STATE, sanitizeTripsState));
  const kv = store ?? created;
  const state = useStore(kv);
  const actions = useMemo<TripsActions>(
    () => ({
      create: (n, places) => {
        const r = T.createTrip(kv.getSnapshot(), n, places);
        kv.update(() => r.state);
        return r.trip;
      },
      addPlaces: (id, places) => kv.update((s) => T.mapTrip(s, id, (t) => T.addPlaces(t, places))),
      addItem: (id, item) => kv.update((s) => T.mapTrip(s, id, (t) => T.addItem(t, item))),
      updateItem: (id, itemId, patch) => kv.update((s) => T.mapTrip(s, id, (t) => T.updateItem(t, itemId, patch))),
      assignDay: (id, itemId, day) => kv.update((s) => T.mapTrip(s, id, (t) => T.assignDay(t, itemId, day))),
      moveItem: (id, itemId, dir) => kv.update((s) => T.mapTrip(s, id, (t) => T.moveItem(t, itemId, dir))),
      toggleDone: (id, itemId) => kv.update((s) => T.mapTrip(s, id, (t) => T.toggleDone(t, itemId))),
      applyPlan: (id, plan) => kv.update((s) => T.mapTrip(s, id, (t) => T.applyPlan(t, plan))),
      editTrip: (id, e) => {
        let result: EditResult | null = null;
        kv.update((s) => T.mapTrip(s, id, (t) => {
          result = T.editTrip(t, { ...e, name: T.uniqueName(s.trips.filter((x) => x.id !== id), e.name) });
          return result.trip;
        }));
        return result;
      },
      trashItem: (id, itemId) => kv.update((s) => T.mapTrip(s, id, (t) => Trash.trashItem(t, itemId, T.randomId(), Date.now()))),
      restoreItem: (id, entryId) => {
        let result: { dayLost: boolean } | null = null;
        kv.update((s) => T.mapTrip(s, id, (t) => {
          const r = Trash.restoreItem(t, entryId);
          result = r ? { dayLost: r.dayLost } : null;
          return r ? r.trip : t;
        }));
        return result;
      },
      purgeItem: (id, entryId) => kv.update((s) => T.mapTrip(s, id, (t) => Trash.purgeItem(t, entryId))),
      current: (id) => kv.getSnapshot().trips.find((t) => t.id === id),
      restore: (snap) => kv.update((s) => T.mapTrip(s, snap.id, () => snap)),
    }),
    [kv],
  );
  const value = useMemo<TripsContextValue>(() => ({ state, actions, trip: (id) => state.trips.find((t) => t.id === id) }), [state, actions]);
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

/** Truy cập kho chuyến đi; ném lỗi nếu quên bọc `TripsProvider`. */
export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips phải nằm trong TripsProvider');
  return ctx;
}
