import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { ItemChange, ItemInput, TripsGateway } from '../api/TripsGateway.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { revertPlan } from '../model/revertPlan.ts';
import { sortTrips } from '../model/tripOrder.ts';
import { placeItemKind } from '../model/placeItemKind.ts';
import type { ItemKind, Trip, TripCover, TripsState } from '../model/trip.types.ts';
import { isPlain, tripDays } from '../model/tripMath.ts';
import * as T from '../model/tripState.ts';
import type { DayPlan, EditResult, ItemPatch, NewTrip, PlaceRef, TripEdit } from '../model/tripState.ts';
import { missingPlaces, validAddDay } from '../model/addMany.ts';
import { createCoverAction } from './coverActions.ts';

/** The actions on the trip store. The server is the source of truth: each action calls the API and then RE-READS that trip into the store (it does not guess the result). A failure throws `ApiError`. */
export interface TripsActions {
  /** Changes the cover optimistically; a network error restores the previous cover before writing. */
  readonly updateCover: (tripId: string, cover: TripCover | null) => Promise<void>;
  /** Creates a trip (the id is issued by the server) and adds the chosen places one by one; returns the re-read trip. */
  readonly create: (n: NewTrip, places: readonly PlaceRef[]) => Promise<Trip>;
  readonly addPlaces: (tripId: string, places: readonly PlaceRef[], day?: string | null) => Promise<void>;
  readonly addItem: (tripId: string, item: ItemInput) => Promise<void>;
  readonly updateItem: (tripId: string, itemId: string, patch: ItemPatch) => Promise<void>;
  /** Assigns a day to an item (null = 'No date yet'); it goes to the end of the new day. */
  readonly assignDay: (tripId: string, itemId: string, day: string | null) => Promise<void>;
  /** Swaps with the adjacent item above/below in the same day; at the start/end or with no date it does nothing. */
  readonly moveItem: (tripId: string, itemId: string, dir: 'up' | 'down') => Promise<void>;
  /** Assigns several items to the end of a day in one atomic schedule command. */
  readonly assignMany: (tripId: string, itemIds: readonly string[], day: string) => Promise<void>;
  readonly toggleDone: (tripId: string, itemId: string) => Promise<void>;
  /** Applies the day-scheduling suggestion: only for items that are 'No date yet' and a day that belongs to the trip. */
  readonly applyPlan: (tripId: string, plan: DayPlan) => Promise<void>;
  /** Edits the trip name/dates; an item that falls out of the date range goes back to 'No date yet' (DR-011 A1) and is counted in the result. Null if there is no trip. */
  readonly editTrip: (tripId: string, e: TripEdit) => Promise<EditResult | null>;
  /** Soft-deletes an item (into 'Recently deleted'). */
  readonly trashItem: (tripId: string, itemId: string) => Promise<void>;
  /** Restores from the trash; returns `dayLost` (the old day no longer exists so it goes to 'No date yet') or null if there is no item. */
  readonly restoreItem: (tripId: string, entryId: string) => Promise<{ readonly dayLost: boolean } | null>;
  /** Permanently deletes an item from the trash (it cannot be undone). */
  readonly purgeItem: (tripId: string, entryId: string) => Promise<void>;
  /** Soft-deletes a whole trip: removes it from the store (a deleted trip can no longer be read so it is not re-read). */
  readonly deleteTrip: (tripId: string) => Promise<void>;
  /** Restores a soft-deleted trip and puts it back into the store. */
  readonly restoreTrip: (tripId: string) => Promise<void>;
  /** Re-reads a trip from the server (after a write outside the store, for example approving a deletion request), without making the list flash 'loading'. */
  readonly refreshTrip: (tripId: string) => Promise<void>;
  /** Undo: puts the trip back to `before` with inverse commands on the server. */
  readonly revert: (before: Trip) => Promise<void>;
  /** The current trip by id (read straight from the store, not through render); used for comparison when Undoing. */
  readonly current: (tripId: string) => Trip | undefined;
  /** Waits for the trip's running jobs to finish (so the Undo 'before' snapshot is taken after the earlier job has re-read). */
  readonly idle: (tripId: string) => Promise<void>;
}

/** What the store actions need: the API gateway and the in-memory state store. */
export interface TripsActionDeps {
  readonly gateway: TripsGateway;
  readonly store: PersistentStore<TripsState>;
}

/** The error code (HTTP 409) when the trip changed elsewhere so it cannot be undone. */
const CONFLICT_CODE = 'CONCURRENT_MODIFICATION';
const CONFLICT_STATUS = 409;
/** Programming error: an action targets a trip that is not in the store. */
const MISSING_TRIP = 'Không có chuyến trong kho:';

/** The data of a new item from a place in the catalog: no date yet, the kind inferred from the place kind, price unknown, awaiting confirmation. */
export function placeInput(place: PlaceRef): ItemInput {
  const type = placeItemKind(place);
  return { type, title: place.name ?? place.id, placeId: place.id, day: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: type === 'rest' ? null : 'pending' };
}

/** A free-form item (or Rest, To-do) from the form fields; price/booking exist only for a kind that has a price, awaiting confirmation by default. */
export function freeInput(type: ItemKind, patch: ItemPatch): ItemInput {
  const { done: _done, position: _position, ...rest } = patch;
  return { type, title: '', placeId: null, day: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: isPlain(type) ? null : 'pending', ...rest };
}

/** What the action groups share: the API gateway, the store read and the function that runs a job in the trip's queue. */
interface Ctx {
  readonly gateway: TripsGateway;
  readonly current: (id: string) => Trip | undefined;
  /** The trip in the store; throws if there is none (every job that calls it runs in the queue so the error becomes a rejected Promise). */
  readonly need: (id: string) => Trip;
  /** Runs `work` IN SEQUENCE after the earlier jobs of the same trip and then re-reads the trip; the input must be computed INSIDE `work` (from the store re-read after the earlier job). */
  readonly run: <T>(tripId: string, work: () => Promise<T>) => Promise<T>;
  /** Like `run` but does NOT re-read the trip afterward (used when the trip can no longer be read, for example just soft-deleted). */
  readonly after: <T>(tripId: string, work: () => Promise<T>) => Promise<T>;
  /** Re-reads a trip from the server into the store. */
  readonly refresh: (tripId: string) => Promise<Trip>;
  readonly addEach: (tripId: string, places: readonly PlaceRef[], day?: string | null) => Promise<void>;
}

/** Whether two trips (read from the server) are identical; compared by content because each read is a new object. */
function sameTrip(a: Trip, b: Trip): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Trip-level actions: create, add places, edit name/dates, undo. */
function tripActions(ctx: Ctx, store: PersistentStore<TripsState>): Pick<TripsActions, 'create' | 'addPlaces' | 'editTrip' | 'revert' | 'deleteTrip' | 'restoreTrip'> {
  const { gateway, current, need, run, addEach } = ctx;
  return {
    create: async (n, places) => {
      const id = await gateway.create({ ...n });
      await run(id, () => addEach(id, places));
      return need(id);
    },
    addPlaces: (tripId, places, day = null) => run(tripId, () => addEach(tripId, places, day)),
    deleteTrip: (tripId) => ctx.after(tripId, async () => {
      await gateway.deleteTrip(tripId);
      store.update((s) => ({ trips: s.trips.filter((t) => t.id !== tripId) }));
    }),
    restoreTrip: (tripId) => ctx.after(tripId, async () => {
      await gateway.restoreTrip(tripId);
      await ctx.refresh(tripId);
    }),
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
        // the trip changed from elsewhere (or another job) since the store last read: undoing would overwrite that change, so it is refused
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

/** Item-level actions: add/edit, assign a day, reorder, tick done, day plan, trash. */
function itemActions(ctx: Ctx): Omit<TripsActions, 'updateCover' | 'create' | 'addPlaces' | 'editTrip' | 'revert' | 'deleteTrip' | 'restoreTrip' | 'refreshTrip' | 'current' | 'idle'> {
  const { gateway, need, run } = ctx;
  /** The part of `ItemPatch` that the item-edit API accepts: drops `done`/`position` (they have their own commands) and an empty title (an item from the catalog keeps its stored title; the backend requires a title). */
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

/** Builds the store actions on the real API (server-first). The jobs of the SAME trip run one after another (no two requests in flight). */
export function createTripsActions({ gateway, store }: TripsActionDeps): TripsActions {
  /** The current trip in the store by id. */
  const current = (id: string): Trip | undefined => store.getSnapshot().trips.find((t) => t.id === id);
  /** The trip in the store; if there is none it throws. */
  const need = (id: string): Trip => {
    const trip = current(id);
    if (!trip) throw new Error(`${MISSING_TRIP} ${id}`);
    return trip;
  };
  /** Re-reads a trip from the server and puts it into the store (replacing the trip with the same id, or adding a new one), keeping the order as the server has it. */
  const refresh = async (tripId: string): Promise<Trip> => {
    const trip = await gateway.load(tripId);
    store.update((s) => ({ trips: sortTrips(s.trips.some((t) => t.id === trip.id) ? s.trips.map((t) => (t.id === trip.id ? trip : t)) : [...s.trips, trip]) }));
    return trip;
  };
  const tails = new Map<string, Promise<unknown>>();
  /** The per-trip queue: chains `work` after the earlier job and then re-reads. If `work` fails it re-reads as best it can and then throws the original error; if `work` is fine but the re-read fails it reports the re-read error. */
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
  /** Reads the server before retrying, dropping an id that was already added even when the previous attempt lost its response; assigns the day right in the create-item command. */
  const addEach = async (tripId: string, places: readonly PlaceRef[], day: string | null = null): Promise<void> => {
    if (!places.length) return;
    const fresh = await refresh(tripId);
    if (!validAddDay(fresh, day)) throw new ApiError(CONFLICT_CODE, CONFLICT_STATUS);
    for (const place of missingPlaces(places, fresh)) await gateway.addItem(tripId, { ...placeInput(place), day });
  };
  const idle = (tripId: string): Promise<void> => (tails.get(tripId) ?? Promise.resolve()).then(() => undefined);
  /** Chains `work` into the trip's queue, without re-reading. */
  const after = <T,>(tripId: string, work: () => Promise<T>): Promise<T> => {
    const job = (tails.get(tripId) ?? Promise.resolve()).then(work);
    tails.set(tripId, job.catch(() => undefined));
    return job;
  };
  const ctx: Ctx = { gateway, current, need, run, after, refresh, addEach };
  return { current, idle, updateCover: createCoverAction(gateway, store, after), refreshTrip: async (tripId) => void (await refresh(tripId)), ...tripActions(ctx, store), ...itemActions(ctx) };
}
