import { ApiError } from '../../../shared/api/ApiError.ts';
import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { TripsGateway } from '../api/TripsGateway.ts';
import type { TripCover, TripsState } from '../model/trip.types.ts';

/** Writes the cover optimistically in the trip queue; a PATCH error restores only the old cover, keeping the other fields. */
export function createCoverAction(gateway: TripsGateway, store: PersistentStore<TripsState>, enqueue: <T>(id: string, work: () => Promise<T>) => Promise<T>): (id: string, cover: TripCover | null) => Promise<void> {
  return (id, cover) => enqueue(id, async () => {
    const before = store.getSnapshot().trips.find(t => t.id === id);
    if (!before || before.role !== 'organizer') throw new ApiError('NOT_ORGANIZER');
    store.update(s => ({ trips: s.trips.map(t => t.id === id ? { ...t, cover } : t) }));
    try {
      await gateway.update(id, { cover });
    } catch (error) {
      store.update(s => ({ trips: s.trips.map(t => t.id === id ? { ...t, cover: before.cover ?? null } : t) }));
      throw error;
    }
  });
}
