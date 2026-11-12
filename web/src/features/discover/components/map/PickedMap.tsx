import { useMemo } from 'react';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { TerrainMapView } from '../../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../../shared/map/TerrainMapView.tsx';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { numberedMarkers } from '../../model/mapMarkers.ts';
import { mapPhotoOrigin } from '../../model/mapPhotoOrigin.ts';
import { firstPhotoUrl } from '../../model/destinationQueries.ts';

const INSETS = { bottom: 26 };
const FIT: MapFit = { ids: null, options: { animate: false, padding: 34 } };

/** A small map of the selected places (numbered in order, static; tap a pin to see detail). */
export function PickedMap({ dest, picked }: { readonly dest: string; readonly picked: readonly PlaceView[] }) {
  const place = usePlaceSheet();
  const markers = useMemo(() => numberedMarkers(picked), [picked]);
  return (
    <div className="pad-x picked-map">
      <TerrainMapView className="mapcard mapcard-s" dest={dest} label={COPY.map.pickedTitle} markers={markers} insets={INSETS} fit={FIT} interactive={false} towns={false} onPin={(id) => place.open(id, { photoOrigin: mapPhotoOrigin(id, firstPhotoUrl(picked.find((p) => p.id === id)), '.mapcard-s') })} />
    </div>
  );
}
