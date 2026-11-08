import { useState } from 'react';
import { useTrips } from './TripsProvider.tsx';

/** Chỉ chọn chuyến cùng điểm đến; tự lấy chuyến đầu tiên nếu danh sách tải sau khi mở form. */
export function useCompatibleTrips(destinationId: string) {
  const { state } = useTrips();
  const [selectedId, select] = useState('');
  const trips = state.trips.filter(trip => trip.destinationId === destinationId);
  const tripId = trips.find(trip => trip.id === selectedId)?.id ?? trips[0]?.id ?? '';
  return { trips, tripId, select };
}
