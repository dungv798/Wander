import { useMemo, useState } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { TerrainMapView } from '../../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../../shared/map/TerrainMapView.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { SectionHead } from '../../../../shared/ui/SectionHead.tsx';
import { Sheet } from '../../../../shared/ui/Sheet.tsx';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { placeMarkers } from '../../model/mapMarkers.ts';

const CARD_INSETS = { bottom: 26 };
const CARD_FIT: MapFit = { ids: null, options: { animate: false, padding: 30 } };
const FULL_FIT: MapFit = { ids: null, options: { animate: false, padding: 48 } };

/** Bản đồ toàn màn có kéo, phóng, gộp cụm; chạm ghim thì đóng bản đồ và mở chi tiết nơi đó. */
function FullMapSheet({ dest, onClose }: { readonly dest: DestinationDetail; readonly onClose: () => void }) {
  const place = usePlaceSheet();
  const markers = useMemo(() => placeMarkers(dest.places), [dest]);
  const title = fill(COPY.map.fullTitle, { dest: dest.name });
  return (
    <Sheet label={title} onClose={onClose} full>
      <div className="mapfull">
        <TerrainMapView
          className="mapbig"
          dest={dest.id}
          label={COPY.map.name}
          markers={markers}
          fit={FULL_FIT}
          onPin={(id) => {
            onClose();
            place.open(id);
          }}
        />
        <IconButton className="close" icon="x" label={COPY.map.closeMap} onClick={onClose} />
        <h2 className="sr">{title}</h2>
      </div>
    </Sheet>
  );
}

/** Khối "<Điểm đến> trên bản đồ": bản đồ nhỏ tĩnh (chạm ghim xem chi tiết) và nút "Mở rộng" để kéo, phóng toàn màn. */
export function DestMapSection({ dest }: { readonly dest: DestinationDetail }) {
  const place = usePlaceSheet();
  const [expanded, setExpanded] = useState(false);
  const markers = useMemo(() => placeMarkers(dest.places), [dest]);
  return (
    <section className="stack rv">
      <SectionHead
        title={fill(COPY.map.sectionTitle, { dest: dest.name })}
        right={
          <button className="linkbtn" type="button" onClick={() => setExpanded(true)}>
            <Icon name="map-pin" size="s" />
            {` ${COPY.map.expand}`}
          </button>
        }
      />
      <TerrainMapView className="mapcard" dest={dest.id} label={fill(COPY.map.cardTitle, { dest: dest.name })} markers={markers} insets={CARD_INSETS} fit={CARD_FIT} interactive={false} towns={false} onPin={place.open} />
      {expanded ? <FullMapSheet dest={dest} onClose={() => setExpanded(false)} /> : null}
    </section>
  );
}
