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
import { firstPhotoUrl } from '../model/destinationQueries.ts';
import { pickedOf } from '../model/discoverState.ts';
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

/** Lưới các nơi đã quẹt phải: chạm để xem chi tiết, nút ✕ để bỏ chọn, thanh dưới để lưu thành chuyến đi. */
function PickedContent({ dest, onSave, showEmpty }: { readonly dest: DestinationDetail; readonly onSave: (picked: readonly PlaceView[]) => void; readonly showEmpty: boolean }) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const picked = useMemo(() => pickedOf(state, dest.places), [state, dest.places]);
  if (!picked.length) {
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
      <div className="picked-create pad-x"><Button block arrow onClick={() => onSave(picked)}>{fill(COPY.picked.saveAsTrip, { n: picked.length })}</Button></div>
      <div className="picked-list pad-x">
        {picked.map((p) => (
          <div key={p.id} className={`tile picked-row cat-${p.category}`}>
            <button data-place-photo={p.id} className="tilebtn" type="button" aria-label={fill(COPY.picked.view, { name: p.name })} onClick={() => sheet.open(p.id)}>
              {p.photos.length ? <RevealImage alt="" src={firstPhotoUrl(p)} /> : <PlacePlaceholder place={p} />}
              <span className="in">
                <h3>{p.name}</h3>
                <p>{p.area}</p>
              </span>
            </button>
            <button className="x" type="button" aria-label={fill(COPY.picked.unpick, { name: p.name })} onClick={() => actions.unpick(p.id)}>
              <Icon name="x" size="s" />
            </button>
          </div>
        ))}
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
