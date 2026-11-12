import { useMemo } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { TerrainMapView } from '../../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../../shared/map/TerrainMapView.tsx';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import { DISCOVER_COPY } from '../../model/discover.copy.ts';
import type { DestinationDetail, PlaceView } from '../../model/Catalog.types.ts';
import { mainAway } from '../../model/destinationQueries.ts';
import { hubMarker, placeMarkers } from '../../model/mapMarkers.ts';
import { isTrek } from '../../model/trekking.ts';

/** The estimated connecting line and the nearby pins; two fingers interact, one finger scrolls the sheet, tapping a pin opens the detail. */
export function PlaceRouteMap({ dest, place }: { readonly dest: DestinationDetail; readonly place: PlaceView }) {
  const sheet = usePlaceSheet();
  const hub = useMemo(() => hubMarker(dest), [dest]);
  const away = mainAway(place);
  const markers = useMemo(
    () => [...(hub ? [hub] : []), ...placeMarkers(dest.places)],
    [hub, dest],
  );
  const fit = useMemo<MapFit>(() => ({ ids: hub ? ['hub', place.id] : [place.id], options: { animate: false } }), [hub, place.id]);
  const trek = isTrek(place);
  // Hiking: the connecting line is only a reference, with no km label as if it were a hiking route.
  const route = useMemo(() => ({ ids: ['hub', place.id], labels: [away && !trek ? fill(COPY.units.kmApprox, { km: away.km }) : ''] }), [place.id, away, trek]);
  if (place.lat == null || place.lon == null) return null;
  return (
    <div className="place-route-map">
      <TerrainMapView className="minimap tm-mini" dest={dest.id} label={fill(COPY.map.routeTitle, { place: place.name })} markers={markers} route={hub ? route : null} selected={place.id} mode="browse" fit={fit} interactive cooperativeGestures towns={false} onPin={(id) => { if (id !== 'hub' && id !== place.id) sheet.open(id); }} />
      <p className="note spaced">{DISCOVER_COPY.mapGestures}</p>
      <p className="note spaced">{trek ? (away ? fill(COPY.place.trekRouteNote, { ref: away.refName }) : COPY.place.trekRouteNoteNoRef) : COPY.place.howToGetNote}</p>
    </div>
  );
}
