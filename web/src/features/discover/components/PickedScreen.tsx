import { useMemo } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import { CATEGORY_ICON } from '../model/discover.const.ts';
import type { DestinationDetail, PlaceView } from '../model/Catalog.types.ts';
import { firstPhotoUrl } from '../model/destinationQueries.ts';
import { pickedOf } from '../model/discoverState.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { PickedMap } from './map/PickedMap.tsx';

/** Đầu trang "Địa điểm đã chọn". */
function PickedHead({ dest }: { readonly dest: DestinationDetail }) {
  return (
    <div className="pagehead pad-x">
      <p className="note">{dest.name}</p>
      <h1>{COPY.picked.title}</h1>
      <p className="note">{COPY.picked.subtitle}</p>
    </div>
  );
}

/** Lưới các nơi đã quẹt phải: chạm để xem chi tiết, nút ✕ để bỏ chọn, thanh dưới để lưu thành chuyến đi. */
function PickedContent({ dest, onSave }: { readonly dest: DestinationDetail; readonly onSave: (picked: readonly PlaceView[]) => void }) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const picked = useMemo(() => pickedOf(state, dest.places), [state, dest.places]);
  if (!picked.length) {
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
      <PickedMap dest={dest.id} picked={picked} />
      <div className="grid pad-x">
        {picked.map((p) => (
          <div key={p.id} className={`tile cat-${p.category}`}>
            <button className="tilebtn" type="button" aria-label={fill(COPY.picked.view, { name: p.name })} onClick={() => sheet.open(p.id)}>
              <img alt="" src={firstPhotoUrl(p)} />
              <span className="in">
                <h3>{p.name}</h3>
                <p>{p.area}</p>
              </span>
            </button>
            <span className="catbadge">
              <Icon name={CATEGORY_ICON[p.category]} />
            </span>
            <button className="x" type="button" aria-label={fill(COPY.picked.unpick, { name: p.name })} onClick={() => actions.unpick(p.id)}>
              <Icon name="x" size="s" />
            </button>
          </div>
        ))}
      </div>
      <div className="stickybar pad-x">
        <Button block icon="calendar-event" onClick={() => onSave(picked)}>
          {fill(COPY.picked.saveAsTrip, { n: picked.length })}
        </Button>
      </div>
    </>
  );
}

/** Màn "Đã chọn": những nơi đã quẹt phải, chưa lưu thành chuyến đi (lưu trên máy). */
export function PickedScreen({ destId, onSave }: { readonly destId: string; readonly onSave: (picked: readonly PlaceView[]) => void }) {
  return <DestinationGate destId={destId}>{(dest) => <PickedContent dest={dest} onSave={onSave} />}</DestinationGate>;
}
