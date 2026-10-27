import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { placeById } from '../model/destinationQueries.ts';
import { About, DataCredits, EditorialRate, Highlights, OsmLink, QuickFacts, SeasonMonths, Tips, TimeOfDay } from './place/PlaceBody.tsx';
import { PlaceGallery } from './place/PlaceGallery.tsx';
import { PlaceRouteMap } from './place/PlaceRouteMap.tsx';

/** Nội dung chi tiết một địa điểm: ảnh, nhãn biên tập, thông tin nhanh, buổi đi, mùa đẹp, mẹo, mô tả, ghi công. */
function PlaceContent({ dest, placeId, inDeck }: { readonly dest: DestinationDetail; readonly placeId: string; readonly inDeck: boolean }) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const goRef = useRef<(delta: number) => void>(() => undefined);
  const place = placeById(dest, placeId);
  if (!place) return null;
  const slot = sheet.slot;
  const canDecide = inDeck && !slot?.noDecide && !slot?.cta && !state.decisions[place.id];

  /** ←/→ chuyển ảnh khi đang xem chi tiết (người dùng bàn phím). */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest('.tmroot')) return;
    e.preventDefault();
    goRef.current(e.key === 'ArrowRight' ? 1 : -1);
  };
  /** Quyết định cho nơi đang xem rồi đóng (từ nút trong tờ chi tiết ở màn quẹt). */
  const decide = (d: 'like' | 'skip'): void => {
    actions.decide(place.id, d);
    sheet.close();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- bắt phím mũi tên nổi lên từ phần tử đang focus bên trong tờ chi tiết
    <div onKeyDown={onKeyDown}>
      <PlaceGallery place={place} onClose={sheet.close} registerGo={(go) => (goRef.current = go)} />
      <div className={`pp cat-${place.category}`}>
        <div className="stack tight">
          <h2>{place.name}</h2>
          <p className="note inline">{`${place.area}, ${dest.name}`}</p>
        </div>
        {slot?.extra}
        <EditorialRate place={place} />
        <QuickFacts place={place} />
        <Highlights place={place} />
        <TimeOfDay place={place} />
        <SeasonMonths place={place} />
        <PlaceRouteMap dest={dest} place={place} />
        <Tips place={place} />
        <About place={place} />
        <OsmLink place={place} />
        <DataCredits place={place} />
      </div>
      {slot?.cta ? <div className="cta-bar">{slot.cta}</div> : null}
      {canDecide ? (
        <div className="cta-bar">
          <Button kind="ghost" icon="x" onClick={() => decide('skip')}>
            {COPY.place.skipThis}
          </Button>
          <Button icon="check" onClick={() => decide('like')}>
            {COPY.place.pickThis}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Tờ chi tiết địa điểm dùng chung cho mọi màn khám phá; ở màn quẹt trên máy tính rộng thì là ngăn kéo bên phải. */
export function PlaceSheet({ dest, inDeck }: { readonly dest: DestinationDetail; readonly inDeck: boolean }) {
  const { placeId, close } = usePlaceSheet();
  if (!placeId) return null;
  const place = placeById(dest, placeId);
  return (
    <Sheet label={place?.name ?? COPY.place.about} onClose={close} asDrawer={inDeck}>
      <PlaceContent key={placeId} dest={dest} placeId={placeId} inDeck={inDeck} />
    </Sheet>
  );
}
