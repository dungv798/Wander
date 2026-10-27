import { useCallback, useMemo, useRef, useState } from 'react';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { navigate, replaceRoute } from '../../../shared/router/hashRoute.ts';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useBottomSheet } from '../../../shared/ui/bottom-sheet/useBottomSheet.ts';
import type { Snap } from '../../../shared/ui/bottom-sheet/bottomSheet.const.ts';
import { DestinationGate, firstPhotoUrl, usePlaceSheet } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { TripViewProvider } from '../hooks/TripViewContext.tsx';
import type { Overlay } from '../hooks/TripViewContext.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import type { Trip } from '../model/trip.types.ts';
import { tripDays } from '../model/tripMath.ts';
import { catalogOf, countText, itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { DayTab } from './DayTab.tsx';
import { ItemCtaSlot, ItemInfoSlot } from './ItemInfoSlot.tsx';
import { OverviewTab } from './OverviewTab.tsx';
import { TripMap } from './TripMap.tsx';
import { TripOverlays } from './TripOverlays.tsx';
import { dateRangeText } from './TripCard.tsx';

const OVERVIEW = 'ov';
const ANNOUNCE_DELAY_MS = 30;
const TAB_ID = 'trip-tab';
const PANEL_ID = 'trip-panel';
const DEFAULT_SNAP: Snap = 'half';

/** Tab hợp lệ từ địa chỉ: `ov` hoặc số ngày 1..n; sai thì về tổng quan. */
function validTab(sub: string | null, dayCount: number): string {
  const n = Number(sub);
  return sub && Number.isInteger(n) && n >= 1 && n <= dayCount ? String(n) : OVERVIEW;
}

/** Thông báo cho trình đọc màn hình: trả [nội dung hiện tại, hàm đọc]; xóa rồi đặt lại để cùng một câu vẫn được đọc lần nữa. */
function useAnnouncer(): readonly [string, (text: string) => void] {
  const [text, setText] = useState('');
  const announce = useCallback(
    /** Đặt nội dung mới sau một nhịp ngắn. */
    (next: string) => {
      setText('');
      window.setTimeout(() => setText(next), ANNOUNCE_DELAY_MS);
    },
    [],
  );
  return [text, announce];
}

/** Dải tab Tổng quan / Ngày n theo mẫu WAI-ARIA: chỉ tab đang chọn nằm trong thứ tự Tab, mũi tên trái/phải, Home, End đổi tab. */
function TripTabs({ days, tab, onTab }: { readonly days: readonly string[]; readonly tab: string; readonly onTab: (t: string) => void }) {
  const keys = [OVERVIEW, ...days.map((_, k) => String(k + 1))];
  const onKeyDown = (e: React.KeyboardEvent): void => {
    const at = keys.indexOf(tab);
    const next = e.key === 'ArrowRight' ? at + 1 : e.key === 'ArrowLeft' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? keys.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = keys[(next + keys.length) % keys.length] as string;
    onTab(target);
    document.getElementById(`${TAB_ID}-${target}`)?.focus();
  };
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- tab là các nút con; phím mũi tên được xử lý ở đây theo mẫu WAI-ARIA
    <div className="dtabs" role="tablist" aria-label={T.view.daysTabs} onKeyDown={onKeyDown}>
      {keys.map((k) => (
        <button key={k} id={`${TAB_ID}-${k}`} className="dtab" role="tab" type="button" aria-selected={tab === k} aria-controls={PANEL_ID} tabIndex={tab === k ? 0 : -1} onClick={() => onTab(k)}>
          {k === OVERVIEW ? T.view.overview : fill(T.view.day, { n: Number(k) })}
        </button>
      ))}
    </div>
  );
}

/** Đầu tờ: tay nắm kéo, ảnh + tên + ngày + số mục, và các tab Tổng quan / Ngày n. */
function TripHead({ trip, dest, days, tab, onTab }: { readonly trip: Trip; readonly dest: DestinationDetail; readonly days: readonly string[]; readonly tab: string; readonly onTab: (t: string) => void }) {
  const first = trip.items.map((i) => dest.places.find((p) => p.id === i.placeId)).find(Boolean);
  return (
    <>
      <button className="grab" type="button" aria-label={T.view.sheetHandle} aria-expanded="true" />
      <div className="thead">
        <img alt="" src={first ? firstPhotoUrl(first) : dest.coverUrl} />
        <div>
          <h1>{trip.name}</h1>
          <p className="note">{`${dateRangeText(trip)} · ${countText(trip)}`}</p>
        </div>
      </div>
      <TripTabs days={days} tab={tab} onTab={onTab} />
    </>
  );
}

/** Khung bản đồ ở đầu màn chuyến đi kèm nút quay lại và nút sửa chuyến. */
function MapBox({ covered, tripId, onEdit }: { readonly covered: number; readonly tripId: string; readonly onEdit: () => void }) {
  return (
    <section className="mapbox">
      <TripMap coveredBottom={covered} />
      <div className="top">
        <IconButton icon="chevron-left" label={T.view.back} onClick={() => navigate(VIEW.TRIPS)} />
        <div className="r">
          <IconButton icon="sun" label={T.today.open} onClick={() => navigate(VIEW.TODAY, tripId)} />
          <IconButton icon="share-2" label={T.export.open} onClick={() => navigate(VIEW.EXPORT, tripId)} />
          <IconButton icon="pencil" label={T.view.edit} onClick={onEdit} />
        </div>
      </div>
    </section>
  );
}

/** Nội dung màn chuyến đi khi đã có chuyến và điểm đến: bản đồ, tờ kéo (đầu + thân), nút nổi, các tờ phủ. */
function TripContent({ trip, dest, sub }: { readonly trip: Trip; readonly dest: DestinationDetail; readonly sub: string | null }) {
  const days = useMemo(() => tripDays(trip), [trip]);
  const tab = validTab(sub, days.length);
  const cat = useMemo(() => catalogOf(dest), [dest]);
  const place = usePlaceSheet();
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [sorting, setSorting] = useState(false);
  const [announcement, announce] = useAnnouncer();
  const [covered, setCovered] = useState(0);
  const sheetRef = useRef<HTMLElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const drawer = useMediaQuery(MEDIA.DRAWER);
  useBottomSheet(sheetRef, headRef, !drawer, DEFAULT_SNAP, (_snap, visible) => setCovered(visible));

  const setTab = useCallback((t: string) => replaceRoute(VIEW.TRIP, trip.id, t), [trip.id]);
  const openItem = useCallback(
    /** Địa điểm → tờ chi tiết kèm tóm tắt và nút của chuyến; mục tự do → trình sửa. */
    (itemId: string) => {
      const item = trip.items.find((i) => i.id === itemId);
      if (!item) return;
      if (item.placeId && cat.place(item.placeId)) place.open(item.placeId, { extra: <ItemInfoSlot tripId={trip.id} itemId={itemId} onEdit={() => setOverlay({ kind: 'editor', itemId, preset: null })} />, cta: <ItemCtaSlot tripId={trip.id} itemId={itemId} name={itemName(item, cat)} onPickDay={() => setOverlay({ kind: 'pickDay', itemId })} /> });
      else setOverlay({ kind: 'editor', itemId, preset: null });
    },
    [trip, cat, place],
  );
  const value = useMemo(
    () => ({ trip, cat, days, tab, setTab, setOverlay, sorting, setSorting, openItem, addMore: () => navigate(VIEW.DECK, dest.id, trip.id), announce }),
    [trip, cat, days, tab, setTab, sorting, openItem, announce, dest.id],
  );

  return (
    <TripViewProvider value={value}>
      <MapBox covered={drawer ? 0 : covered} tripId={trip.id} onEdit={() => setOverlay({ kind: 'editTrip' })} />
      <section className="sheetbody" ref={sheetRef}>
        <div className="sheet-head pad-x" ref={headRef}>
          <TripHead trip={trip} dest={dest} days={days} tab={tab} onTab={setTab} />
        </div>
        <div className="sheet-scroll">
          <div className="pad-x">
            <div className="tbody" role="tabpanel" id={PANEL_ID} aria-labelledby={`${TAB_ID}-${tab}`}>
              {tab === OVERVIEW ? <OverviewTab /> : <DayTab index={Number(tab) - 1} />}
            </div>
          </div>
        </div>
      </section>
      <div className="float">
        <Button icon="plus" onClick={value.addMore}>
          {T.view.addPlaces}
        </Button>
      </div>
      <div className="sr" aria-live="polite">
        {announcement}
      </div>
      <TripOverlays overlay={overlay} onClose={() => setOverlay(null)} />
    </TripViewProvider>
  );
}

/** Màn chuyến đi theo mã trong địa chỉ; không có chuyến thì báo rõ và cho đường về danh sách. */
export function TripScreen({ tripId, sub }: { readonly tripId: string; readonly sub: string | null }) {
  const { trip: find } = useTrips();
  const trip = find(tripId);
  if (!trip) {
    return <EmptyState role="status" title={T.view.notFoundTitle} text={T.view.notFoundText} actions={<Button onClick={() => navigate(VIEW.TRIPS)}>{T.view.backToList}</Button>} />;
  }
  return <DestinationGate destId={trip.destinationId}>{(dest) => <TripContent key={trip.id} trip={trip} dest={dest} sub={sub} />}</DestinationGate>;
}
