/** The trip model on the front end. Field names follow the backend contract (`TripDetail`/`Item` in `web/src/api.ts`): `costK`, `referenceK`, `timeOfDay`, `durationMin`, `booking`, `done`. */

/** The nine item kinds (D13), codes the same as the backend's `ItemType`. */
export type ItemKind = 'sightseeing' | 'food' | 'transport' | 'lodging' | 'car_rental' | 'shopping' | 'tour' | 'rest' | 'task';

/** The booking status (A-14, DR-003): only an item kind that has a price has it; Rest and To-do are `null`. */
export type BookingStatus = 'pending' | 'booked';

/** One item in a trip: a place from the catalog (`placeId`) or a free-form item. */
export interface TripItem {
  readonly id: string;
  /** The id of the place in the editorial catalog; null for a free-form item. */
  readonly placeId: string | null;
  readonly type: ItemKind;
  /** The name of a free-form item (a place takes its name from the catalog, left empty). */
  readonly title: string;
  /** The day `yyyy-mm-dd`; null = 'No date yet' (DR-011 A1). */
  readonly day: string | null;
  /** The order in the day (0, 1, 2...); null when not scheduled. */
  readonly position: number | null;
  readonly timeOfDay: string | null;
  readonly durationMin: number | null;
  readonly note: string;
  /** The cost, in thousand VND. null = price unknown; 0 = known to be zero (D18). */
  readonly costK: number | null;
  /** 'Included': it is inside another price, NOT added to the total (D18). */
  readonly included: boolean;
  /** The reference price when included (R4). */
  readonly referenceK: number | null;
  readonly booking: BookingStatus | null;
  /** Whether the viewer themself has finished the task/visited the place item (per person, D10/DR-029). */
  readonly done: boolean;
  /** The id of the member who added the item (null = Organizer/old data); used for the permission to edit/delete one's own item (H3). */
  readonly addedBy: string | null;
  /** The ids of the current members who have finished the task/visited the place item; used for the shared progress. */
  readonly doneBy: readonly string[];
}

/** A soft-deleted item (D19): kept until permanently deleted, remembering the old day and position so it can be restored to the exact place. */
export interface TrashEntry {
  readonly id: string;
  readonly item: TripItem;
  /** The time of deletion (milliseconds since the epoch). */
  readonly deletedAt: number;
  /** The item's day at deletion; null if it had no day then. */
  readonly day: string | null;
  /** The position in the day at deletion. */
  readonly position: number | null;
}

/** The cover saved on the server: a catalog photo id or one of the six gradient codes (DR-031). */
export interface TripCover {
  readonly kind: 'photo' | 'gradient';
  readonly ref: string;
}

/** One trip. */
export interface Trip {
  /** null/absent in old data is the destination's default photo. */
  readonly cover?: TripCover | null;
  readonly id: string;
  /** The viewer's role (Q6): the Organizer is the trip owner, a Member joined by link. */
  readonly role: 'organizer' | 'member';
  /** The number of members including the Organizer. */
  readonly memberCount: number;
  /** The member id of the viewer themself (null if not known). */
  readonly selfMemberId: string | null;
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  /** 'Expected N days' (A3, DR-018): dates not fixed, displayed 'tentative'. */
  readonly datesTentative: boolean;
  /** 'Who is going' (F2, DR-018): the trip-kind label, not yet a member list. */
  readonly kind: string | null;
  /** Interests (place kinds) chosen at creation (F2, DR-018). */
  readonly interests: readonly string[];
  /** The trip-style codes (at most 5, Q11). */
  readonly styles: readonly string[];
  readonly pace: string | null;
  /** The budget, in thousand VND; null = not set. */
  readonly budgetK: number | null;
  readonly items: readonly TripItem[];
  /** 'Recently deleted' (D19): soft-deleted items, newest first. */
  readonly trash: readonly TrashEntry[];
  readonly createdAt: number;
}

/** The state of the trip store (stored on the device in the FE phase; replaced by the backend in FE-10). */
export interface TripsState {
  readonly trips: readonly Trip[];
}
