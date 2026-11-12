import type { BookingStatus, ItemKind, Trip, TripCover } from '../model/trip.types.ts';

/** The data for creating a trip (`kind`, `styles`, `pace`, `interests` codes match the backend; money in thousand VND). */
export interface NewTripInput {
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly datesTentative?: boolean;
  readonly kind?: string | null;
  readonly interests?: readonly string[];
  readonly styles?: readonly string[];
  readonly pace?: string | null;
  readonly budgetK?: number | null;
}

/** Edits a trip: a field that is not given stays unchanged, given `null` clears it (not set). */
export type TripPatch = Partial<Omit<NewTripInput, 'destinationId'>> & { readonly cover?: TripCover | null };

/** The data of a new item. `day` null = 'no date yet'; `position` not given = the end of the day. */
export interface ItemInput {
  readonly type: ItemKind;
  readonly title: string;
  readonly placeId: string | null;
  readonly day: string | null;
  readonly position?: number;
  readonly timeOfDay: string | null;
  readonly durationMin: number | null;
  readonly note: string;
  readonly costK: number | null;
  readonly included: boolean;
  readonly referenceK: number | null;
  readonly booking: BookingStatus | null;
}

/** Edits an item: a field that is not given stays unchanged (`placeId` cannot be changed). */
export type ItemChange = Partial<Omit<ItemInput, 'placeId'>>;

/** One item in the schedule command: assigns a day (null = drop the day) and an optional position. */
export interface DayAssignment {
  readonly itemId: string;
  readonly day: string | null;
  readonly position?: number;
}

/** The atomic schedule command: change the date range and/or assign dates in bulk in one transaction (also the way to Undo). */
export interface ScheduleChange {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly assignments?: readonly DayAssignment[];
}

/** One trip in 'Recently deleted trips' (only the summary part, items not loaded). */
export interface DeletedTrip {
  readonly id: string;
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  /** The time of deletion, milliseconds since the epoch. */
  readonly deletedAt: number;
}

/** The gateway to the trips API of the identity owner. Every failure is an `ApiError` with the backend's code. */
export interface TripsGateway {
  /** Every trip of the owner with the visible items and the trash. */
  loadAll(): Promise<Trip[]>;
  /** One full trip (the detail + the trash). */
  load(tripId: string): Promise<Trip>;
  /** Creates a trip, returns the id issued by the server. */
  create(input: NewTripInput): Promise<string>;
  update(tripId: string, patch: TripPatch): Promise<void>;
  /** Adds an item, returns the id issued by the server. */
  addItem(tripId: string, input: ItemInput): Promise<string>;
  editItem(tripId: string, itemId: string, change: ItemChange): Promise<void>;
  /** Soft delete (into 'Recently deleted'). */
  trash(tripId: string, itemId: string): Promise<void>;
  /** Restores from the trash (if the old day no longer exists it goes back to 'no date yet'). */
  restore(tripId: string, itemId: string): Promise<void>;
  /** Permanently deletes an item that is already in the trash. */
  purge(tripId: string, itemId: string): Promise<void>;
  setDone(tripId: string, itemId: string, done: boolean): Promise<void>;
  /** Reorders the visible items of a day by the order `orderedIds`. */
  reorderDay(tripId: string, day: string, orderedIds: readonly string[]): Promise<void>;
  schedule(tripId: string, change: ScheduleChange): Promise<void>;
  /** Soft-deletes a whole trip (into 'Recently deleted trips'). */
  deleteTrip(tripId: string): Promise<void>;
  /** Restores a soft-deleted trip. */
  restoreTrip(tripId: string): Promise<void>;
  /** The soft-deleted trips, most recently deleted first. */
  loadDeleted(): Promise<DeletedTrip[]>;
}
