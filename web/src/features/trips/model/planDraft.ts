import type { Trip } from './trip.types.ts';

/** Re-reading the same content after a network error does not lose the draft; a change of day, item or permission must be recomputed. */
export function planDraftKey(trip: Trip): string {
  return JSON.stringify([trip.id, trip.destinationId, trip.startDate, trip.endDate, trip.role, trip.items]);
}
