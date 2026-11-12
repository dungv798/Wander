import type { Trip, TripItem } from './trip.types.ts';

/**
 * What the viewer may do on a trip (H3/H4, DR-021). This is ONLY to hide buttons to reduce clutter: the real permission is decided by the server and it still
 * returns 403 if the UI lets a button be pressed by mistake.
 */
export interface TripPermissions {
  /** Is the Organizer (the trip owner). */
  readonly organizer: boolean;
  /** Edit the trip, invite people, remove people, delete the trip, approve requests. */
  readonly manageTrip: boolean;
  /** Schedule days/order (the schedule command): Organizer only. */
  readonly schedule: boolean;
  /** Permanently delete an item in 'Recently deleted': Organizer only. */
  readonly purge: boolean;
  /** Edit/delete/restore an item: the Organizer any item, a member only the items they added. */
  readonly canChange: (item: TripItem) => boolean;
}

/** The permissions of the person viewing the trip; without their own member id a member can edit no item. */
export function permissionsOf(trip: Pick<Trip, 'role' | 'selfMemberId'>): TripPermissions {
  const organizer = trip.role === 'organizer';
  return {
    organizer,
    manageTrip: organizer,
    schedule: organizer,
    purge: organizer,
    canChange: (item) => organizer || (trip.selfMemberId !== null && item.addedBy === trip.selfMemberId),
  };
}
