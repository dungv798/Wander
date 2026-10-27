import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { ItemChange, ItemInput, TripsGateway } from '../api/TripsGateway.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { revertPlan } from '../model/revertPlan.ts';
import { sortTrips } from '../model/tripOrder.ts';
import { PLACE_KIND } from '../model/trip.const.ts';
import type { ItemKind, Trip, TripsState } from '../model/trip.types.ts';
import { isPlain, tripDays } from '../model/tripMath.ts';
import * as T from '../model/tripState.ts';
import type { DayPlan, EditResult, ItemPatch, NewTrip, PlaceRef, TripEdit } from '../model/tripState.ts';

/** Các thao tác trên kho chuyến đi. Máy chủ là nguồn sự thật: mỗi thao tác gọi API rồi ĐỌC LẠI chuyến đó vào kho (không đoán kết quả). Thất bại ném `ApiError`. */
export interface TripsActions {
  /** Tạo chuyến (mã do máy chủ cấp) và thêm lần lượt các địa điểm đã chọn; trả chuyến đã đọc lại. */
  readonly create: (n: NewTrip, places: readonly PlaceRef[]) => Promise<Trip>;
  readonly addPlaces: (tripId: string, places: readonly PlaceRef[]) => Promise<void>;
  readonly addItem: (tripId: string, item: ItemInput) => Promise<void>;
  readonly updateItem: (tripId: string, itemId: string, patch: ItemPatch) => Promise<void>;
  /** Gán ngày cho một mục (null = "Chưa có ngày"); xuống cuối ngày mới. */
  readonly assignDay: (tripId: string, itemId: string, day: string | null) => Promise<void>;
  /** Đổi chỗ với mục kề trên/dưới cùng ngày; ở đầu/cuối hoặc chưa có ngày thì không làm gì. */
  readonly moveItem: (tripId: string, itemId: string, dir: 'up' | 'down') => Promise<void>;
  /** Gán nhiều mục vào cuối một ngày trong một lệnh lịch nguyên tử. */
  readonly assignMany: (tripId: string, itemIds: readonly string[], day: string) => Promise<void>;
  readonly toggleDone: (tripId: string, itemId: string) => Promise<void>;
  /** Áp dụng gợi ý xếp ngày: chỉ cho mục đang "Chưa có ngày" và ngày thuộc chuyến. */
  readonly applyPlan: (tripId: string, plan: DayPlan) => Promise<void>;
  /** Sửa tên/ngày chuyến; mục rơi khỏi khoảng ngày về "Chưa có ngày" (DR-011 A1) và được đếm ở kết quả. Null nếu không có chuyến. */
  readonly editTrip: (tripId: string, e: TripEdit) => Promise<EditResult | null>;
  /** Xóa mềm một mục (vào "Đã xóa gần đây"). */
  readonly trashItem: (tripId: string, itemId: string) => Promise<void>;
  /** Khôi phục từ thùng rác; trả `dayLost` (ngày cũ không còn nên về "Chưa có ngày") hoặc null nếu không có mục. */
  readonly restoreItem: (tripId: string, entryId: string) => Promise<{ readonly dayLost: boolean } | null>;
  /** Xóa vĩnh viễn một mục khỏi thùng rác (không hoàn tác được). */
  readonly purgeItem: (tripId: string, entryId: string) => Promise<void>;
  /** Hoàn tác: đưa chuyến trở lại `before` bằng các lệnh ngược trên máy chủ. */
  readonly revert: (before: Trip) => Promise<void>;
  /** Chuyến hiện tại theo mã (đọc thẳng kho, không qua render); dùng để so sánh khi Hoàn tác. */
  readonly current: (tripId: string) => Trip | undefined;
  /** Chờ các việc đang chạy của chuyến xong (để chụp "trước" của Hoàn tác sau khi việc trước đã đọc lại). */
  readonly idle: (tripId: string) => Promise<void>;
}

/** Những thứ thao tác kho cần: cổng API và kho trạng thái trong bộ nhớ. */
export interface TripsActionDeps {
  readonly gateway: TripsGateway;
  readonly store: PersistentStore<TripsState>;
}

/** Mã lỗi (HTTP 409) khi chuyến đã đổi ở nơi khác nên không hoàn tác được. */
const CONFLICT_CODE = 'CONCURRENT_MODIFICATION';
const CONFLICT_STATUS = 409;
/** Lỗi lập trình: thao tác nhắm vào chuyến không có trong kho. */
const MISSING_TRIP = 'Không có chuyến trong kho:';

/** Thông tin một mục mới từ địa điểm trong kho: chưa có ngày, loại suy ra từ loại địa điểm, chưa biết giá, chờ xác nhận. */
export function placeInput(place: PlaceRef): ItemInput {
  return { type: PLACE_KIND[place.category] ?? 'sightseeing', title: place.name ?? place.id, placeId: place.id, day: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending' };
}

/** Mục tự do (hoặc Nghỉ, Việc cần làm) từ các trường của biểu mẫu; giá/đặt chỗ chỉ có ở loại có giá, mặc định chờ xác nhận. */
export function freeInput(type: ItemKind, patch: ItemPatch): ItemInput {
  const { done: _done, position: _position, ...rest } = patch;
  return { type, title: '', placeId: null, day: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: isPlain(type) ? null : 'pending', ...rest };
}

/** Những thứ dùng chung của các nhóm thao tác: cổng API, đọc kho và hàm chạy một việc trong hàng đợi của chuyến. */
interface Ctx {
  readonly gateway: TripsGateway;
  readonly current: (id: string) => Trip | undefined;
  /** Chuyến trong kho; ném lỗi nếu không có (mọi việc gọi nó chạy trong hàng đợi nên lỗi trở thành Promise bị từ chối). */
  readonly need: (id: string) => Trip;
  /** Chạy `work` NỐI TIẾP các việc trước của cùng chuyến rồi đọc lại chuyến; đầu vào phải tính BÊN TRONG `work` (từ kho đã đọc lại sau việc trước). */
  readonly run: <T>(tripId: string, work: () => Promise<T>) => Promise<T>;
  readonly addEach: (tripId: string, places: readonly PlaceRef[]) => Promise<void>;
}

/** Hai chuyến (đã đọc từ máy chủ) có giống hệt nhau không; so theo nội dung vì mỗi lần đọc là một đối tượng mới. */
function sameTrip(a: Trip, b: Trip): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Thao tác cấp chuyến: tạo, thêm địa điểm, sửa tên/ngày, hoàn tác. */
function tripActions(ctx: Ctx, store: PersistentStore<TripsState>): Pick<TripsActions, 'create' | 'addPlaces' | 'editTrip' | 'revert'> {
  const { gateway, current, need, run, addEach } = ctx;
  return {
    create: async (n, places) => {
      const id = await gateway.create({ ...n });
      await run(id, () => addEach(id, places));
      return need(id);
    },
    addPlaces: (tripId, places) => run(tripId, () => addEach(tripId, places)),
    editTrip: (tripId, e) =>
      run(tripId, async () => {
        const trip = current(tripId);
        if (!trip) return null;
        const planned = T.editTrip(trip, e);
        const rangeChanged = e.startDate !== trip.startDate || e.endDate !== trip.endDate;
        const before = new Map(trip.items.map((i) => [i.id, i.day]));
        const assignments = planned.trip.items.filter((i) => before.get(i.id) !== i.day).map((i) => (i.day === null ? { itemId: i.id, day: null } : { itemId: i.id, day: i.day, position: i.position ?? undefined }));
        if (rangeChanged || assignments.length) await gateway.schedule(tripId, { ...(rangeChanged ? { startDate: e.startDate, endDate: e.endDate } : {}), ...(assignments.length ? { assignments } : {}) });
        const patch = { ...(e.name !== trip.name ? { name: e.name } : {}), ...(e.confirmDates && trip.datesTentative ? { datesTentative: false } : {}) };
        if (Object.keys(patch).length) await gateway.update(tripId, patch);
        return { lost: planned.lost, lostIds: planned.lostIds };
      }).then((r) => (r ? { trip: need(tripId), lost: r.lost, lostIds: r.lostIds } : null)),
    revert: (before) =>
      run(before.id, async () => {
        // chuyến đã đổi từ nơi khác (hoặc việc khác) kể từ lúc kho đọc lần cuối: hoàn tác sẽ ghi đè mất thay đổi đó, nên từ chối
        const fresh = await gateway.load(before.id);
        if (!sameTrip(fresh, need(before.id))) {
          store.update((s) => ({ trips: sortTrips(s.trips.map((t) => (t.id === fresh.id ? fresh : t))) }));
          throw new ApiError(CONFLICT_CODE, CONFLICT_STATUS);
        }
        for (const step of revertPlan(before, fresh)) {
          if (step.kind === 'schedule') await gateway.schedule(before.id, step.change);
          else if (step.kind === 'restore') await gateway.restore(before.id, step.itemId);
          else if (step.kind === 'trash') await gateway.trash(before.id, step.itemId);
          else if (step.kind === 'edit') await gateway.editItem(before.id, step.itemId, step.change);
          else if (step.kind === 'discard') {
            await gateway.trash(before.id, step.itemId);
            await gateway.purge(before.id, step.itemId);
          } else await gateway.update(before.id, step.patch);
        }
      }),
  };
}

/** Thao tác cấp mục: thêm/sửa, gán ngày, đổi chỗ, tích xong, kế hoạch ngày, thùng rác. */
function itemActions(ctx: Ctx): Omit<TripsActions, 'create' | 'addPlaces' | 'editTrip' | 'revert' | 'current' | 'idle'> {
  const { gateway, need, run } = ctx;
  /** Phần của `ItemPatch` mà API sửa mục nhận: bỏ `done`/`position` (có lệnh riêng) và tiêu đề rỗng (mục từ kho giữ tiêu đề đã lưu; backend bắt buộc tiêu đề). */
  const toChange = (patch: ItemPatch): ItemChange => {
    const { done: _done, position: _position, title, ...rest } = patch;
    return title ? { ...rest, title } : rest;
  };
  return {
    addItem: (tripId, item) => run(tripId, async () => void (await gateway.addItem(tripId, item))),
    updateItem: (tripId, itemId, patch) => run(tripId, () => gateway.editItem(tripId, itemId, toChange(patch))),
    assignDay: (tripId, itemId, day) => run(tripId, () => gateway.editItem(tripId, itemId, { day })),
    moveItem: (tripId, itemId, dir) =>
      run(tripId, async () => {
        const trip = need(tripId);
        const moving = trip.items.find((i) => i.id === itemId);
        if (!moving || moving.day === null) return;
        const ids = trip.items.filter((i) => i.day === moving.day).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.id);
        const from = ids.indexOf(itemId);
        const to = dir === 'up' ? from - 1 : from + 1;
        if (to < 0 || to >= ids.length) return;
        [ids[from], ids[to]] = [ids[to]!, ids[from]!];
        await gateway.reorderDay(tripId, moving.day, ids);
      }),
    assignMany: (tripId, itemIds, day) =>
      run(tripId, async () => {
        const start = need(tripId).items.filter((i) => i.day === day).length;
        await gateway.schedule(tripId, { assignments: itemIds.map((itemId, k) => ({ itemId, day, position: start + k })) });
      }),
    toggleDone: (tripId, itemId) =>
      run(tripId, async () => {
        const found = need(tripId).items.find((i) => i.id === itemId);
        if (found) await gateway.setDone(tripId, itemId, !found.done);
      }),
    applyPlan: (tripId, plan) =>
      run(tripId, async () => {
        const trip = need(tripId);
        const days = new Set(tripDays(trip));
        const assignments = trip.items.filter((i) => i.day === null && plan[i.id] && days.has(plan[i.id]!.day)).map((i) => ({ itemId: i.id, day: plan[i.id]!.day, position: plan[i.id]!.position }));
        if (assignments.length) await gateway.schedule(tripId, { assignments });
      }),
    trashItem: (tripId, itemId) => run(tripId, () => gateway.trash(tripId, itemId)),
    restoreItem: (tripId, entryId) =>
      run(tripId, async () => {
        const entry = need(tripId).trash.find((x) => x.id === entryId);
        if (!entry) return null;
        await gateway.restore(tripId, entryId);
        return { day: entry.day };
      }).then((r) => (r ? { dayLost: r.day !== null && need(tripId).items.find((i) => i.id === entryId)?.day === null } : null)),
    purgeItem: (tripId, entryId) => run(tripId, () => gateway.purge(tripId, entryId)),
  };
}

/** Dựng các thao tác kho trên API thật (server-first). Các việc của CÙNG một chuyến chạy nối tiếp nhau (không có hai yêu cầu cùng bay). */
export function createTripsActions({ gateway, store }: TripsActionDeps): TripsActions {
  /** Chuyến hiện tại trong kho theo mã. */
  const current = (id: string): Trip | undefined => store.getSnapshot().trips.find((t) => t.id === id);
  /** Chuyến trong kho; không có thì ném lỗi. */
  const need = (id: string): Trip => {
    const trip = current(id);
    if (!trip) throw new Error(`${MISSING_TRIP} ${id}`);
    return trip;
  };
  /** Đọc lại một chuyến từ máy chủ và đặt vào kho (thay chuyến cùng mã, hoặc thêm mới), giữ thứ tự như máy chủ. */
  const refresh = async (tripId: string): Promise<Trip> => {
    const trip = await gateway.load(tripId);
    store.update((s) => ({ trips: sortTrips(s.trips.some((t) => t.id === trip.id) ? s.trips.map((t) => (t.id === trip.id ? trip : t)) : [...s.trips, trip]) }));
    return trip;
  };
  const tails = new Map<string, Promise<unknown>>();
  /** Hàng đợi theo chuyến: nối `work` sau việc trước, rồi đọc lại. `work` lỗi thì đọc lại hết sức rồi ném lỗi gốc; `work` ổn mà đọc lại lỗi thì báo lỗi đọc lại. */
  const run = <T,>(tripId: string, work: () => Promise<T>): Promise<T> => {
    const job = (tails.get(tripId) ?? Promise.resolve()).then(async () => {
      let result: T;
      try {
        result = await work();
      } catch (e) {
        await refresh(tripId).catch(() => undefined);
        throw e;
      }
      await refresh(tripId);
      return result;
    });
    tails.set(tripId, job.catch(() => undefined));
    return job;
  };
  /** Thêm lần lượt các địa điểm (tuần tự để giữ thứ tự thêm). */
  const addEach = async (tripId: string, places: readonly PlaceRef[]): Promise<void> => {
    for (const place of places) await gateway.addItem(tripId, placeInput(place));
  };
  const idle = (tripId: string): Promise<void> => (tails.get(tripId) ?? Promise.resolve()).then(() => undefined);
  const ctx: Ctx = { gateway, current, need, run, addEach };
  return { current, idle, ...tripActions(ctx, store), ...itemActions(ctx) };
}
