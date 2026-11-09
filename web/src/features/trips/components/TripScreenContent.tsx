import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { navigate, replaceRoute } from '../../../shared/router/hashRoute.ts';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useBottomSheet } from '../../../shared/ui/bottom-sheet/useBottomSheet.ts';
import type { Snap } from '../../../shared/ui/bottom-sheet/bottomSheet.const.ts';
import { DestinationGate, usePlaceSheet } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { TripViewProvider } from '../hooks/TripViewContext.tsx';
import type { Overlay } from '../hooks/TripViewContext.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import type { Trip } from '../model/trip.types.ts';
import { tripDays, unassignedItems } from '../model/tripMath.ts';
import { catalogOf, itemName } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { DayTab } from './DayTab.tsx';
import { useTripToast } from '../hooks/useTripToast.ts';
import { useGoneGuard } from '../hooks/useGoneGuard.ts';
import { ItemCtaSlot, ItemInfoSlot } from './ItemInfoSlot.tsx';
import { OverviewTab } from './OverviewTab.tsx';
import { CostBox } from './CostBox.tsx';
import { TripCoverHead } from './TripCoverHead.tsx';
import { TRIP_PANEL_ID, TripNav, activeTabId } from './TripNav.tsx';
import { UnassignedTab } from './UnassignedTab.tsx';
import { TripMap } from './TripMap.tsx';
import { TripOverlays } from './TripOverlays.tsx';
import { modeOfTab, validTab } from '../model/tripTabs.ts';

const ANNOUNCE_DELAY_MS = 30;
const DEFAULT_SNAP: Snap = 'half';

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

/** Đầu tờ: tay nắm kéo, bìa chuyến (kèm nhóm Chia sẻ/Người đi cùng) và hai tầng điều khiển chế độ xem + chọn ngày. */
function TripHead({ trip, dest, days, tab, lastDay, onTab, onPeople }: { readonly trip: Trip; readonly dest: DestinationDetail; readonly days: readonly string[]; readonly tab: string; readonly lastDay: string; readonly onTab: (t: string) => void; readonly onPeople: () => void }) {
  return (
    <>
      <button className="grab" type="button" aria-label={T.view.sheetHandle} aria-expanded="true" />
      <TripCoverHead trip={trip} dest={dest} onPeople={onPeople} compact={modeOfTab(tab) !== 'overview'} />
      <TripNav tab={tab} days={days} unassigned={unassignedItems(trip).length} lastDay={lastDay} onTab={onTab} />
    </>
  );
}

/** Khung bản đồ ở đầu màn chuyến đi kèm nút quay lại và nút sửa chuyến. */
function MapBox({ covered, tripId, onEdit }: { readonly covered: number; readonly tripId: string; readonly onEdit: (() => void) | null }) {
  return (
    <section className="mapbox">
      <TripMap coveredBottom={covered} />
      <div className="top">
        <IconButton icon="chevron-left" label={T.view.backToList} onClick={() => navigate(VIEW.TRIPS)} />
        <div className="r">
          <IconButton icon="sun" label={T.today.open} onClick={() => navigate(VIEW.TODAY, tripId)} />
          <IconButton icon="share-2" label={T.export.open} onClick={() => navigate(VIEW.EXPORT, tripId)} />
          {onEdit ? <IconButton icon="pencil" label={T.view.edit} onClick={onEdit} /> : null}
        </div>
      </div>
    </section>
  );
}

/** Nội dung màn chuyến đi khi đã có chuyến và điểm đến: bản đồ, tờ kéo (đầu + thân), nút nổi, các tờ phủ. */
function TripContent({ trip, dest, sub }: { readonly trip: Trip; readonly dest: DestinationDetail; readonly sub: string | null }) {
  useTripToast();
  const days = useMemo(() => tripDays(trip), [trip]);
  const tab = validTab(sub, days.length);
  const mode = modeOfTab(tab);
  // Ngày đang xem gần nhất: vào lại chế độ Lịch sẽ trở về đúng ngày đó.
  const [lastDay, setLastDay] = useState('1');
  if (mode === 'schedule' && tab !== lastDay) setLastDay(tab);
  const cat = useMemo(() => catalogOf(dest), [dest]);
  const place = usePlaceSheet();
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [sorting, setSorting] = useState(false);
  const [announcement, announce] = useAnnouncer();
  const [covered, setCovered] = useState(0);
  const sheetRef = useRef<HTMLElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const drawer = useMediaQuery(MEDIA.DRAWER);
  useBottomSheet(sheetRef, headRef, !drawer, DEFAULT_SNAP, (_snap, visible) => setCovered(visible));

  // Đổi tab (Tổng quan ↔ Ngày n) luôn bắt đầu từ đầu danh sách, không giữ vị trí cuộn của tab trước.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const setTab = useCallback((t: string) => replaceRoute(VIEW.TRIP, trip.id, t), [trip.id]);
  const openItem = useCallback(
    /** Địa điểm → tờ chi tiết kèm tóm tắt và nút của chuyến; mục tự do → trình sửa. */
    (itemId: string) => {
      const item = trip.items.find((i) => i.id === itemId);
      if (!item) return;
      if (item.placeId && cat.place(item.placeId)) place.open(item.placeId, { extra: <ItemInfoSlot tripId={trip.id} itemId={itemId} onEdit={() => setOverlay({ kind: 'editor', itemId, preset: null })} />, cta: <ItemCtaSlot tripId={trip.id} itemId={itemId} name={itemName(item, cat)} onPickDay={() => setOverlay({ kind: 'pickDay', itemId })} onRequestDelete={() => setOverlay({ kind: 'requestDelete', itemId })} /> });
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
      <MapBox covered={drawer ? 0 : covered} tripId={trip.id} onEdit={permissionsOf(trip).manageTrip ? () => setOverlay({ kind: 'editTrip' }) : null} />
      <section className="sheetbody" ref={sheetRef}>
        <div className="sheet-head pad-x" ref={headRef}>
          <TripHead trip={trip} dest={dest} days={days} tab={tab} lastDay={lastDay} onTab={setTab} onPeople={() => setOverlay({ kind: 'people' })} />
        </div>
        <div className="sheet-scroll" ref={scrollRef}>
          <div className="pad-x">
            <div className="tbody" role="tabpanel" id={TRIP_PANEL_ID} aria-labelledby={activeTabId(tab)}>
              {mode === 'overview' ? <OverviewTab /> : mode === 'schedule' ? <DayTab index={Number(tab) - 1} /> : mode === 'unassigned' ? <UnassignedTab /> : <CostBox allDays />}
            </div>
            <div className="trip-add"><Button kind="ghost" icon="plus" onClick={value.addMore}>{T.view.addPlaces}</Button></div>
          </div>
        </div>
      </section>
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
  useGoneGuard(tripId);
  const trip = find(tripId);
  if (!trip) {
    return <EmptyState role="status" title={T.view.notFoundTitle} text={T.view.notFoundText} actions={<Button onClick={() => navigate(VIEW.TRIPS)}>{T.view.backToList}</Button>} />;
  }
  return <DestinationGate destId={trip.destinationId}>{(dest) => <TripContent key={trip.id} trip={trip} dest={dest} sub={sub} />}</DestinationGate>;
}
