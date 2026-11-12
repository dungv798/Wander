import { useState } from 'react';
import { useTrips } from './TripsProvider.tsx';

/** Chooses only trips of the same destination; automatically takes the first trip if the list loads after the form opens. */
export function useCompatibleTrips(destinationId: string) {
  const { state } = useTrips();
  const [selectedId, select] = useState('');
  const trips = state.trips.filter(trip => trip.destinationId === destinationId);
  const tripId = trips.find(trip => trip.id === selectedId)?.id ?? trips[0]?.id ?? '';
  return { trips, tripId, select };
}
