import { useMemo } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { TerrainMapView } from '../../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../../shared/map/TerrainMapView.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import type { DestinationDetail, PlaceView } from '../../model/Catalog.types.ts';
import { firstPhotoUrl, mainAway } from '../../model/destinationQueries.ts';
import { hubMarker } from '../../model/mapMarkers.ts';

const FIT: MapFit = { ids: null, options: { animate: false, padding: 44 } };

/** Khối "Đường đi": bản đồ nhỏ nối mốc chính (TP Hà Giang) với nơi này kèm số km ước tính. Không có tọa độ thì không hiện. */
export function PlaceRouteMap({ dest, place }: { readonly dest: DestinationDetail; readonly place: PlaceView }) {
  const hub = useMemo(() => hubMarker(dest), [dest]);
  const away = mainAway(place);
  const markers = useMemo(
    () => (hub && place.lat != null && place.lon != null ? [hub, { id: place.id, lat: place.lat, lon: place.lon, label: place.name, thumb: firstPhotoUrl(place) }] : []),
    [hub, place],
  );
  const route = useMemo(() => ({ ids: ['hub', place.id], labels: [away ? fill(COPY.units.kmApprox, { km: away.km }) : ''] }), [place.id, away]);
  if (!markers.length) return null;
  return (
    <div>
      <h4>
        <Icon name="route" />
        {COPY.place.howToGet}
      </h4>
      <TerrainMapView className="minimap tm-mini" dest={dest.id} label={fill(COPY.map.routeTitle, { place: place.name })} markers={markers} route={route} mode="route" fit={FIT} interactive={false} towns={false} credit={false} />
      <p className="note spaced">{COPY.place.howToGetNote}</p>
    </div>
  );
}
