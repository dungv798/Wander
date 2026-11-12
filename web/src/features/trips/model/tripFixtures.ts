// Used only in tests: quickly builds an in-memory `Trip` (the server is where it is really stored and numbered).
import { placeItemKind } from './placeItemKind.ts';
import type { ItemKind, Trip, TripItem, TripsState } from './trip.types.ts';
import { normalize } from './tripState.ts';
import type { ItemPatch, NewTrip, PlaceRef } from './tripState.ts';

type IdSource = () => string;

/** An empty store. */
export const S0: TripsState = { trips: [] };

/** An item from a place in the catalog: no day yet, the kind inferred from the place kind, price unknown. */
function placeItem(place: PlaceRef, id: IdSource): TripItem {
  const type = placeItemKind(place);
  return { id: id(), placeId: place.id, type, title: '', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: type === 'rest' ? null : 'pending', done: false, addedBy: null, doneBy: [] };
}

/** A free-form item (Rest/To-do have no booking). */
export function freeItem(type: ItemKind, title: string, id: IdSource): TripItem {
  const plain = type === 'rest' || type === 'task';
  return { id: id(), placeId: null, type, title, day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: plain ? null : 'pending', done: false, addedBy: null, doneBy: [] };
}

/** Adds a trip to the store with the chosen places (items with no day yet). */
export function createTrip(s: TripsState, n: NewTrip, places: readonly PlaceRef[], id: IdSource, now = 1): { state: TripsState; trip: Trip } {
  const trip: Trip = {
    id: id(), role: 'organizer', memberCount: 1, selfMemberId: null, name: n.name, destinationId: n.destinationId, startDate: n.startDate, endDate: n.endDate, datesTentative: n.datesTentative ?? false, kind: n.kind ?? null,
    interests: n.interests ?? [], styles: n.styles ?? [], pace: n.pace ?? null, budgetK: n.budgetK ?? null, items: places.map((p) => placeItem(p, id)), trash: [], createdAt: now,
  };
  return { state: { trips: [...s.trips, trip] }, trip };
}

/** Adds an item to the end of its day and renumbers. */
export function addItem(t: Trip, item: TripItem): Trip {
  return normalize({ ...t, items: [...t.items, item] });
}

/** Edits the fields of an item. */
export function updateItem(t: Trip, itemId: string, patch: ItemPatch): Trip {
  return normalize({ ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
}

/** Assigns a day to an item (it goes to the end of that day). */
export function assignDay(t: Trip, itemId: string, day: string | null): Trip {
  const next = t.items.map((i) => (i.id === itemId ? { ...i, day, position: day === null ? null : Number.MAX_SAFE_INTEGER } : i));
  return normalize({ ...t, items: next });
}
