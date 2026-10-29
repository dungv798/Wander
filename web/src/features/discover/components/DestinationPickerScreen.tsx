import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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
import { COUNTRY_MAP_ID, DESTINATION_SEARCH_DEBOUNCE_MS, DESTINATION_SEARCH_ZOOM } from '../model/destination.const.ts';
import '../destinations.css';

/** Màn chọn điểm đến toàn màn; camera chỉ đổi sau khi ngừng gõ một giây. */
export default function DestinationPickerScreen() {
  const { destinations, status, retry, select } = useCurrentDestination();
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
  /** Lưu mã hợp lệ rồi đi thẳng tới bộ thẻ quẹt của điểm đến vừa chọn. */
  function choose(id: string): void {
    select(id);
    navigate(VIEW.DECK, id);
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
      <label className="destination-picker-search">
        <span className="sr">{COPY.home.searchLabel}</span>
        <input ref={input} type="search" value={query} placeholder={COPY.destinations.search} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => onKey(event, -1)} />
      </label>
      <TerrainMapView className="destination-picker-map" dest={COUNTRY_MAP_ID} label={COPY.destinations.map} markers={markers} fit={fit} onPin={choose} />
      <DestinationResults status={status} retry={retry} count={matches.length} />
      <ul className="destination-picker-list" aria-label={COPY.destinations.hint}>
        {matches.map((destination, index) => (
          <li key={destination.id}>
            <button ref={(element) => { rows.current[index] = element; }} type="button" onClick={() => choose(destination.id)} onKeyDown={(event) => onKey(event, index)}>
              <RevealImage src={destination.coverUrl} alt="" loading="lazy" />
              <span><strong>{destination.name}</strong><span>{destination.region}</span></span>
              <small>{fill(COPY.common.placeCount, { n: destination.placeCount })}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Hiện trạng thái tải, lỗi có thể thử lại hoặc thông điệp không khớp. */
function DestinationResults({ status, retry, count }: { readonly status: string; readonly retry: () => void; readonly count: number }) {
  if (status === 'error') return <div role="alert">{COPY.state.loadErrorTitle}<Button onClick={retry}>{COPY.common.retry}</Button></div>;
  return <p role="status" className="destination-picker-hint">{status === 'loading' ? COPY.common.loading : count ? COPY.destinations.hint : COPY.destinations.empty}</p>;
}
