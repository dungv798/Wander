import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { useMemo } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import { useResource } from '../../../shared/hooks/useResource.ts';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import type { DestinationDetail, PlaceView } from '../model/Catalog.types.ts';
import { firstPhotoThumbUrl } from '../model/destinationQueries.ts';
import { pickedOf, savedPicksOf } from '../model/discoverState.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { MapPeekButton } from './MapPeekButton.tsx';
import { PlacePlaceholder } from './PlacePlaceholder.tsx';

/** Đầu trang "Địa điểm đã chọn". */
function PickedHead({ dest }: { readonly dest: DestinationDetail }) {
  return (
    <div className="pagehead pad-x">
      <p className="note">{COPY.picked.subtitle}</p>
      <div className="picked-headline"><h1>{COPY.picked.title}</h1><span>{dest.name}</span></div>
    </div>
  );
}

/** Một hàng nơi đã chọn: chạm để xem chi tiết, nút ✕ để bỏ chọn; `saved` thêm nhãn "Đã vào chuyến đi". */
function PickedRow({ place, saved }: { readonly place: PlaceView; readonly saved: boolean }) {
  const { actions } = useDiscover();
  const sheet = usePlaceSheet();
  return (
    <div className={`tile picked-row cat-${place.category}`}>
      <button data-place-photo={place.id} className="tilebtn" type="button" aria-label={fill(COPY.picked.view, { name: place.name })} onClick={() => sheet.open(place.id)}>
        {place.photos.length ? <RevealImage alt="" src={firstPhotoThumbUrl(place)} /> : <PlacePlaceholder place={place} />}
        <span className="in">
          <h3>{place.name}</h3>
          <p>{place.area}</p>
          {saved ? <span className="picked-tag">{COPY.picked.inTrip}</span> : null}
        </span>
      </button>
      <button className="x" type="button" aria-label={fill(COPY.picked.unpick, { name: place.name })} onClick={() => actions.unpick(place.id)}>
        <Icon name="x" size="s" />
      </button>
    </div>
  );
}

/** Lưới các nơi đã quẹt phải: nơi chờ lưu kèm nút "Lưu N địa điểm", rồi các nơi đã vào chuyến kèm nhãn (B-06). */
function PickedContent({ dest, onSave, showEmpty }: { readonly dest: DestinationDetail; readonly onSave: (picked: readonly PlaceView[]) => void; readonly showEmpty: boolean }) {
  const { state } = useDiscover();
  const picked = useMemo(() => pickedOf(state, dest.places), [state, dest.places]);
  const saved = useMemo(() => savedPicksOf(state, dest.places), [state, dest.places]);
  if (!picked.length && !saved.length) {
    if (!showEmpty) return null;
    return (
      <>
        <PickedHead dest={dest} />
        <div className="empty pad-x">
          <h2 className="h2">{COPY.picked.emptyTitle}</h2>
          <p>{COPY.picked.emptyText}</p>
          <Button onClick={() => navigate(VIEW.DEST, dest.id)}>{COPY.picked.startExploring}</Button>
        </div>
      </>
    );
  }
  return (
    <>
      <PickedHead dest={dest} />
      <div className="picked-create pad-x">
        {picked.length
          ? <Button block arrow onClick={() => onSave(picked)}>{fill(COPY.picked.saveAsTrip, { n: picked.length })}</Button>
          : <p className="note">{COPY.picked.allSaved}</p>}
      </div>
      <div className="picked-list pad-x">
        {picked.map((p) => <PickedRow key={p.id} place={p} saved={false} />)}
        {saved.map((p) => <PickedRow key={p.id} place={p} saved />)}
      </div>
      <div className="pad-x picked-map-peek"><MapPeekButton /></div>
    </>
  );
}

/** Màn "Đã chọn": những nơi đã quẹt phải, chưa lưu thành chuyến đi (lưu trên máy). */
export function PickedScreen({ destId, onSave }: { readonly destId: string; readonly onSave: (picked: readonly PlaceView[]) => void }) {
  const { destinations, select } = useCurrentDestination();
  const { catalog, state } = useDiscover();
  const { state: loaded } = useResource(signal => Promise.all(destinations.map(destination => catalog.destination(destination.id, signal))), [catalog, destinations]);
  const others = loaded.status === 'ready' ? loaded.data.filter(destination => destination.id !== destId && pickedOf(state, destination.places).length > 0) : [];
  return <>
    {loaded.status === 'error' ? <p role="alert" className="pad-x">{COPY.state.loadErrorText}</p> : null}
    <DestinationGate destId={destId}>{(dest) => <PickedContent dest={dest} onSave={onSave} showEmpty={!others.length} />}</DestinationGate>
    {others.map(dest => <DestinationGate key={dest.id} destId={dest.id}>{detail => <PickedContent dest={detail} onSave={picked => { select(dest.id); onSave(picked); }} showEmpty={false} />}</DestinationGate>)}
  </>;
}
