import { useMemo } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { routeSegmentsForDays } from '../../../shared/map/routeSegments.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { MapMarker } from '../../../shared/map/map.types.ts';
import { firstPhotoUrl } from '../../discover/index.ts';
import type { TripItem } from '../model/trip.types.ts';
import type { TripCatalog } from '../model/tripView.ts';
import { itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Each shared fit-to-frame: no flying (avoiding motion in a small frame), leaving a margin for the photo pin. */
const FIT: MapFit = { ids: null, options: { animate: false, padding: 40 } };

/**
 * The REAL route map of today: the places with coordinates of the day being viewed, numbered in order, connected by a route with an estimated km;
 * a place that is done fades. The same base, pin and attribution style as the trip map; if no place has coordinates nothing is drawn (no invented position).
 */
export function TodayMap({ cat, items }: { readonly cat: TripCatalog; readonly items: readonly TripItem[] }) {
  const markers = useMemo<MapMarker[]>(() => items.flatMap((item, index) => {
    const place = cat.place(item.placeId);
    if (!place || place.lat === null || place.lon === null) return [];
    return [{ id: item.id, lat: place.lat, lon: place.lon, label: itemName(item, cat), thumb: firstPhotoUrl(place), num: index + 1, muted: item.done }];
  }), [items, cat]);
  const route = useMemo(() => {
    const segments = routeSegmentsForDays([markers.map((marker) => marker.id)], markers);
    if (!segments.length) return null;
    return { ids: markers.map((marker) => marker.id), segments, labels: segments.map((segment) => fill(COPY.map.routeEstimate, { km: Math.max(1, Math.round(segment.km)) })) };
  }, [markers]);
  if (!markers.length) return null;
  return (
    <section className="today-map" aria-label={T.view.mapLabel}>
      <TerrainMapView className="tmap-today" dest={cat.dest.id} label={T.view.mapLabel} markers={markers} route={route} mode="route" fit={FIT} interactive cooperativeGestures towns={false} />
    </section>
  );
}
