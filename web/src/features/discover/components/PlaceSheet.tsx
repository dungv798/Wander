import { useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { placeById } from '../model/destinationQueries.ts';
import { DEST_COPY } from '../model/dest.copy.ts';
import { DISCOVER_COPY } from '../model/discover.copy.ts';
import { OsmLink } from './place/PlaceBody.tsx';
import { PlaceHead } from './place/PlaceHead.tsx';
import { PlaceMedia } from './place/PlaceMedia.tsx';
import { PlaceInformation } from './place/PlaceInformation.tsx';
import { PlaceTripAction } from './place/PlaceTripAction.tsx';
import '../place.css';

/** Nội dung chi tiết một địa điểm, thông tin thực dụng trước: ảnh, về nơi này, thông số, có gì, buổi/mùa/mẹo (gập), đường đi, rồi ý kiến biên tập, đánh giá và ghi công. */
function PlaceContent({ dest, placeId, inDeck }: { readonly dest: DestinationDetail; readonly placeId: string; readonly inDeck: boolean }) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const goRef = useRef<(delta: number) => void>(() => undefined);
  /** Thanh ảnh đăng ký hàm chuyển ảnh để phím ←/→ của tờ dùng được. */
  const registerGo = useCallback((go: (delta: number) => void): void => { goRef.current = go; }, []);
  const place = placeById(dest, placeId);
  if (!place) return null;
  const slot = sheet.slot;
  const canDecide = inDeck && !slot?.noDecide && !slot?.cta && !state.decisions[place.id];
  /** Ngoài bộ thẻ (Điểm đến, Đã chọn, ghim bản đồ) mà không có hành động riêng của chuyến: nút "Chọn"/"Đã chọn" bật/tắt như thẻ ở danh sách. */
  const canToggle = !inDeck && !slot?.noDecide && !slot?.cta;
  const chosen = state.decisions[place.id] === 'like';

  /** ←/→ chuyển ảnh khi đang xem chi tiết (người dùng bàn phím). */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], .tmroot')) return;
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
    <div className="place-content" onKeyDown={onKeyDown}>
      <div className="place-scroll">
        <PlaceHead dest={dest} place={place} onClose={sheet.close} />
        <div className="pd-layout">
          <PlaceMedia place={place} registerGo={registerGo} />
          <PlaceInformation dest={dest} place={place} extra={slot?.extra} mapLink={canToggle} />
        </div>
      </div>
      <div className="cta-bar place-actions">
        <span className="place-action-title">{place.name}</span>
        {canToggle ? null : <OsmLink place={place} />}
        {slot?.cta}
        {canToggle ? (
          <Button kind="ghost" icon={chosen ? 'check' : 'plus'} aria-pressed={chosen} onClick={() => (chosen ? actions.unpick(place.id) : actions.decide(place.id, 'like'))}>
            {chosen ? DEST_COPY.chosen : DISCOVER_COPY.pick}
          </Button>
        ) : null}
        {canToggle ? <PlaceTripAction destId={dest.id} place={place} /> : null}
        {canDecide ? <>
          <Button kind="ghost" icon="x" onClick={() => decide('skip')}>
            {COPY.place.skipThis}
          </Button>
          <Button icon="check" aria-label={COPY.place.pickThis} onClick={() => decide('like')}>
            {DISCOVER_COPY.pick}
          </Button>
        </> : null}
      </div>
    </div>
  );
}

/** Tờ chi tiết địa điểm dùng chung cho mọi màn khám phá; ở màn quẹt trên máy tính rộng thì là ngăn kéo bên phải. */
export function PlaceSheet({ dest, inDeck }: { readonly dest: DestinationDetail; readonly inDeck: boolean }) {
  const { placeId, close } = usePlaceSheet();
  if (!placeId) return null;
  const place = placeById(dest, placeId);
  if (!place) return null;
  return (
    <Sheet label={place?.name ?? COPY.place.about} onClose={close}>
      <PlaceContent key={placeId} dest={dest} placeId={placeId} inDeck={inDeck} />
    </Sheet>
  );
}
