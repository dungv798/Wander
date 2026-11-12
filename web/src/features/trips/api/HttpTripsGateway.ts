import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR, HTTP } from '../../../shared/api/http.const.ts';
import type { ApiMember } from '../../../shared/api/contract.ts';
import type { Trip } from '../model/trip.types.ts';
import type { DeletedTrip, ItemChange, ItemInput, NewTripInput, ScheduleChange, TripPatch, TripsGateway } from './TripsGateway.ts';
import { detailItems, toTrash, toTrip } from './tripMapper.ts';
import { TRIPS_API as P } from './tripsApi.const.ts';

type Body = Record<string, unknown>;

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Copies the keys that are present (including `null`, meaning 'clear') from `source` into the request body by a field-name map; an `undefined` key is dropped. */
function pick(source: object, names: Readonly<Record<string, string>>): Body {
  const from = source as Body;
  const body: Body = {};
  for (const [key, apiName] of Object.entries(names)) if (from[key] !== undefined) body[apiName] = from[key];
  return body;
}

/** The FE field name -> the API field name of a trip. */
const TRIP_FIELDS = { name: 'name', destinationId: 'destination', startDate: 'startDate', endDate: 'endDate', budgetK: 'budget', styles: 'styles', pace: 'pace', datesTentative: 'datesTentative', kind: 'kind', interests: 'interests', cover: 'cover' } as const satisfies Readonly<Record<string, ApiMember<'UpdateTripRequest'>>>;
/** The FE field name -> the API field name of an item. */
const ITEM_FIELDS = { type: 'type', title: 'title', placeId: 'placeId', day: 'day', position: 'position', timeOfDay: 'timeOfDay', durationMin: 'durationMin', note: 'note', costK: 'cost', included: 'included', referenceK: 'referenceCost', booking: 'booking' } as const satisfies Readonly<Record<string, ApiMember<'ItemRequest'>>>;

/** Gets the `key` element of the response body; missing or a wrong shape is an internal error (so the UI never uses broken data). */
function part(body: unknown, key: string): Body {
  const value = isRecord(body) ? body[key] : undefined;
  if (!isRecord(value)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return value;
}

/** The id (a string) of a response object. */
function idOf(obj: Body): string {
  if (typeof obj['id'] !== 'string') throw new ApiError(CLIENT_ERROR.INTERNAL);
  return obj['id'];
}

/** Implements `TripsGateway` with the real API; the session secret is attached by `ApiClient`. */
export class HttpTripsGateway implements TripsGateway {
  private readonly client: ApiClient;

  /** Uses the given HTTP client (injectable in tests). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** The path of a trip, optionally with a suffix. */
  private path(tripId: string, suffix = ''): string {
    return `${P.TRIPS}/${encodeURIComponent(tripId)}${suffix}`;
  }

  /** The path of an item, optionally with a suffix. */
  private itemPath(tripId: string, itemId: string, suffix = ''): string {
    return this.path(tripId, `${P.ITEMS}/${encodeURIComponent(itemId)}${suffix}`);
  }

  /** Every trip of the owner with the items and the trash (each trip is read in parallel). */
  async loadAll(): Promise<Trip[]> {
    const body = await this.client.get<unknown>(P.TRIPS);
    const list = isRecord(body) ? body[P.KEY_TRIPS] : undefined;
    if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    const loaded = await Promise.all(list.map((view) => this.load(idOf(isRecord(view) ? view : {})).catch((e: unknown) => {
      // a trip disappeared between listing and reading (deleted on another device): skip it; other errors are still reported
      if (e instanceof ApiError && e.status === HTTP.NOT_FOUND) return null;
      throw e;
    })));
    return loaded.filter((t): t is Trip => t !== null);
  }

  /** One full trip: the detail (the schedule by day) and the trash are read in parallel. */
  async load(tripId: string): Promise<Trip> {
    const [detail, trash] = await Promise.all([this.client.get<unknown>(this.path(tripId)), this.client.get<unknown>(this.path(tripId, P.TRASH))]);
    const rawTrash: unknown = isRecord(trash) ? trash[P.KEY_ITEMS] : undefined;
    if (!Array.isArray(rawTrash)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    const trip = toTrip(isRecord(detail) ? detail[P.KEY_TRIP] : undefined, detailItems(detail), rawTrash.map(toTrash).filter((t) => t !== null));
    if (!trip) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return trip;
  }

  /** Creates a trip and returns the new id. */
  async create(input: NewTripInput): Promise<string> {
    return idOf(part(await this.client.send<unknown>('POST', P.TRIPS, pick(input, TRIP_FIELDS)), P.KEY_TRIP));
  }

  /** Edits a trip: only the fields that are given. */
  async update(tripId: string, patch: TripPatch): Promise<void> {
    await this.client.send('PATCH', this.path(tripId), pick(patch, TRIP_FIELDS));
  }

  /** Adds an item and returns the new id. */
  async addItem(tripId: string, input: ItemInput): Promise<string> {
    return idOf(part(await this.client.send<unknown>('POST', this.path(tripId, P.ITEMS), pick(input, ITEM_FIELDS)), P.KEY_ITEM));
  }

  /** Edits an item: only the fields that are given (`null` clears the price/time...). */
  async editItem(tripId: string, itemId: string, change: ItemChange): Promise<void> {
    await this.client.send('PATCH', this.itemPath(tripId, itemId), pick(change, ITEM_FIELDS));
  }

  /** Soft-deletes an item. */
  async trash(tripId: string, itemId: string): Promise<void> {
    await this.client.send('DELETE', this.itemPath(tripId, itemId));
  }

  /** Restores an item from the trash. */
  async restore(tripId: string, itemId: string): Promise<void> {
    await this.client.send('POST', this.itemPath(tripId, itemId, P.RESTORE));
  }

  /** Permanently deletes an item in the trash (it cannot be undone). */
  async purge(tripId: string, itemId: string): Promise<void> {
    await this.client.send('DELETE', this.itemPath(tripId, itemId, P.PERMANENT));
  }

  /** Marks or unmarks a to-do as done. */
  async setDone(tripId: string, itemId: string, done: boolean): Promise<void> {
    await this.client.send('PUT', this.itemPath(tripId, itemId, P.DONE), { done });
  }

  /** Reorders the visible items of a day. */
  async reorderDay(tripId: string, day: string, orderedIds: readonly string[]): Promise<void> {
    await this.client.send('POST', this.path(tripId, `${P.DAYS}/${encodeURIComponent(day)}${P.REORDER}`), { orderedIds });
  }

  /** Soft-deletes a whole trip. */
  async deleteTrip(tripId: string): Promise<void> {
    await this.client.send('DELETE', this.path(tripId));
  }

  /** Restores a soft-deleted trip. */
  async restoreTrip(tripId: string): Promise<void> {
    await this.client.send('POST', this.path(tripId, P.RESTORE));
  }

  /** The soft-deleted trips (the summary part); a broken element is dropped, a wrongly shaped body is an internal error. */
  async loadDeleted(): Promise<DeletedTrip[]> {
    const body = await this.client.get<unknown>(`${P.TRIPS}${P.DELETED}`);
    const list: unknown = isRecord(body) ? body[P.KEY_TRIPS] : undefined;
    if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return list.flatMap((entry) => {
      const view = isRecord(entry) ? toTrip(entry[P.KEY_TRIP], [], []) : null;
      const stamp = isRecord(entry) ? entry[P.KEY_DELETED_AT] : undefined;
      const at = typeof stamp === 'string' ? Date.parse(stamp) : Number.NaN;
      return view && !Number.isNaN(at) ? [{ id: view.id, name: view.name, destinationId: view.destinationId, startDate: view.startDate, endDate: view.endDate, deletedAt: at }] : [];
    });
  }

  /** The atomic schedule command (change the date range and/or assign dates in bulk). */
  async schedule(tripId: string, change: ScheduleChange): Promise<void> {
    await this.client.send('POST', this.path(tripId, P.SCHEDULE), change);
  }
}
