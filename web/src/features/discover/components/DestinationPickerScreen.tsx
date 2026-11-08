import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MutableRefObject } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { goBack, navigate } from '../../../shared/router/hashRoute.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { MapMarker } from '../../../shared/map/map.types.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import { filterDestinations } from '../model/destinationSelection.ts';
import { firstPhotoUrl } from '../model/destinationQueries.ts';
import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';
import { PLACE_SEARCH_LIMIT, searchPlaces } from '../model/placeSearch.ts';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import { DestinationGate } from './DestinationGate.tsx';
import { COUNTRY_MAP_ID, DESTINATION_SEARCH_DEBOUNCE_MS, DESTINATION_SEARCH_ZOOM } from '../model/destination.const.ts';
import '../destinations.css';

/** Phạm vi tìm: điểm đến (thành phố/vùng) hoặc địa điểm bên trong thành phố đang chọn. */
type SearchScope = 'destinations' | 'places';

/** Màn chọn điểm đến toàn màn; camera chỉ đổi sau khi ngừng gõ một giây. */
export default function DestinationPickerScreen({ initialScope }: { readonly initialScope?: string | null }) {
  const { destinations, status, retry, select, selectedId } = useCurrentDestination();
  const [scope, setScope] = useState<SearchScope>(initialScope === 'places' ? 'places' : 'destinations');
  const cityName = destinations.find((d) => d.id === selectedId)?.name ?? null;
  const inPlaces = scope === 'places';
  const [query, setQuery] = useState('');
  const [settled, setSettled] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const matches = filterDestinations(destinations, query);
  const target = settled.trim() ? filterDestinations(destinations, settled)[0] : undefined;
  const markers = useMemo<readonly MapMarker[]>(() => target?.lat != null && target.lon != null
    ? [{ id: target.id, lat: target.lat, lon: target.lon, label: target.name, kind: 'hub' }] : [], [target]);
  const fit = useMemo<MapFit>(() => ({ ids: markers.map((marker) => marker.id), options: { maxZoom: DESTINATION_SEARCH_ZOOM } }), [markers]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(query), DESTINATION_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);
  /** Lưu điểm đến rồi mở trang khám phá của nơi đó; người dùng chọn danh sách/map hoặc quẹt theo flow B. */
  function choose(id: string): void {
    select(id);
    navigate(VIEW.DEST, id);
  }
  /** Chọn thành phố từ tab Địa điểm: ở lại màn này và chuyển sang tìm bên trong thành phố đó, giữ truy vấn đang gõ. */
  function pickCity(id: string): void {
    select(id);
    setScope('places');
  }
  /** Mũi tên đi giữa ô tìm và các dòng; Escape trở về trang chủ. */
  function onKey(event: KeyboardEvent, index: number): void {
    if (event.key === 'Escape') { event.preventDefault(); goBack(); }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const next = event.key === 'ArrowDown' ? Math.min(index + 1, matches.length - 1) : index - 1;
    if (next < 0) input.current?.focus();
    else rows.current[next]?.focus();
  }
  return (
    <section className="destination-picker">
      <header className="destination-picker-header">
        <IconButton icon="arrow-back-up" label={COPY.common.back} onClick={goBack} />
        <h1>{COPY.destinations.title}</h1>
      </header>
      <div className="destination-scope" role="tablist" aria-label={COPY.destinations.scopeLabel}>
        <button type="button" role="tab" aria-selected={!inPlaces} onClick={() => setScope('destinations')}>{COPY.destinations.scopeDestinations}</button>
        <button type="button" role="tab" aria-selected={inPlaces} onClick={() => setScope('places')}>{cityName ? fill(COPY.destinations.scopePlaces, { dest: cityName }) : COPY.destinations.scopePlacesNone}</button>
      </div>
      <label className="destination-picker-search">
        <span className="sr">{inPlaces && cityName ? fill(COPY.destinations.placesSearch, { dest: cityName }) : COPY.home.searchLabel}</span>
        <input ref={input} type="search" value={query} placeholder={inPlaces && cityName ? fill(COPY.destinations.placesSearch, { dest: cityName }) : COPY.destinations.search} disabled={inPlaces && !cityName} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => onKey(event, -1)} />
      </label>
      {inPlaces
        ? <PlacesPane selectedId={selectedId} cityName={cityName} query={query} destinations={destinations} onPickCity={pickCity} />
        : <DestinationsPane matches={matches} markers={markers} fit={fit} status={status} retry={retry} rows={rows} onChoose={choose} onKey={onKey} />}
    </section>
  );
}

/** Tab "Điểm đến": bản đồ cả nước, trạng thái tải và danh sách điểm đến khớp. */
function DestinationsPane({ matches, markers, fit, status, retry, rows, onChoose, onKey }: {
  readonly matches: readonly DestinationSummary[]; readonly markers: readonly MapMarker[]; readonly fit: MapFit; readonly status: string; readonly retry: () => void;
  readonly rows: MutableRefObject<(HTMLButtonElement | null)[]>; readonly onChoose: (id: string) => void; readonly onKey: (event: KeyboardEvent, index: number) => void;
}) {
  return (
    <>
      <TerrainMapView className="destination-picker-map" dest={COUNTRY_MAP_ID} label={COPY.destinations.map} markers={markers} fit={fit} onPin={onChoose} />
      <DestinationResults status={status} retry={retry} count={matches.length} />
      <ul className="destination-picker-list" aria-label={COPY.destinations.hint}>
        {matches.map((destination, index) => (
          <li key={destination.id}>
            <button ref={(element) => { rows.current[index] = element; }} type="button" onClick={() => onChoose(destination.id)} onKeyDown={(event) => onKey(event, index)}>
              <RevealImage src={destination.coverUrl} alt="" loading="lazy" />
              <span><strong>{destination.name}</strong><span>{destination.region}</span></span>
              <small>{fill(COPY.common.placeCount, { n: destination.placeCount })}</small>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Tab "Địa điểm": chưa chọn thành phố thì hướng dẫn chọn (không tự mặc định); đã chọn thì tìm trong thành phố đó. */
function PlacesPane({ selectedId, cityName, query, destinations, onPickCity }: {
  readonly selectedId: string | null; readonly cityName: string | null; readonly query: string; readonly destinations: readonly DestinationSummary[]; readonly onPickCity: (id: string) => void;
}) {
  if (selectedId && cityName) {
    return (
      <>
        <p className="destination-picker-hint" role="status">{fill(COPY.destinations.placesWhere, { dest: cityName })}</p>
        <DestinationGate destId={selectedId}>{(dest) => <PlaceResults dest={dest} query={query} />}</DestinationGate>
      </>
    );
  }
  return (
    <div className="destination-picker-need">
      <p role="status">{COPY.destinations.placesNeedCity}</p>
      <div className="chips" role="group" aria-label={COPY.destinations.placesPickCity}>
        {destinations.map((d) => <Button key={d.id} kind="ghost" onClick={() => onPickCity(d.id)}>{d.name}</Button>)}
      </div>
    </div>
  );
}

/** Kết quả tìm địa điểm trong một điểm đến: ảnh, tên, loại · khu vực; chạm mở tờ chi tiết của địa điểm. */
function PlaceResults({ dest, query }: { readonly dest: DestinationDetail; readonly query: string }) {
  const { open } = usePlaceSheet();
  const hits = searchPlaces(dest.places, query);
  if (!hits.length) return <p role="status" className="destination-picker-hint">{fill(COPY.destinations.placesEmpty, { q: query.trim(), dest: dest.name })}</p>;
  return (
    <ul className="destination-picker-list" aria-label={fill(COPY.destinations.placesCount, { n: hits.length })}>
      {hits.slice(0, PLACE_SEARCH_LIMIT).map((place) => (
        <li key={place.id}>
          <button type="button" onClick={() => open(place.id)}>
            <RevealImage src={firstPhotoUrl(place)} alt="" loading="lazy" />
            <span><strong>{place.name}</strong><span>{place.categoryName} · {place.area}</span></span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Hiện trạng thái tải, lỗi có thể thử lại hoặc thông điệp không khớp. */
function DestinationResults({ status, retry, count }: { readonly status: string; readonly retry: () => void; readonly count: number }) {
  if (status === 'error') return <div role="alert">{COPY.state.loadErrorTitle}<Button onClick={retry}>{COPY.common.retry}</Button></div>;
  return <p role="status" className="destination-picker-hint">{status === 'loading' ? COPY.common.loading : count ? COPY.destinations.hint : COPY.destinations.empty}</p>;
}
