import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { COPY } from '../shared/const/copy.vi.ts';
import { HIDE_TABBAR_ALWAYS, HIDE_TABBAR_ON_PHONE, VIEW } from '../shared/const/routes.const.ts';
import { useIsWide } from '../shared/hooks/useMediaQuery.ts';
import { navigate, replaceRoute, useRoute } from '../shared/router/hashRoute.ts';
import { ScreenHost } from '../shared/ui/ScreenHost.tsx';
import { Icon } from '../shared/ui/Icon.tsx';
import { ToastProvider, useToast } from '../shared/ui/Toast.tsx';
import { CurrentDestinationProvider, useCurrentDestination, DeckScreen, DestScreen, DiscoverProvider, DiscoveryTopicProvider, HomeScreen, PickedScreen, PlaceSheetProvider, ShellMap, MapChrome, ShellSheetContext, SHELL_MAP, useDiscover } from '../features/discover/index.ts';
import type { AddingMode, PlaceView, SheetMode } from '../features/discover/index.ts';
import { ExpiredScreen, IdentityProvider, RecoverScreen, SecurityScreen, useReportError, useSessionExpired } from '../features/identity/index.ts';
import { SettingsScreen } from '../features/settings/index.ts';
import { OnboardScreen, OnboardingProvider, useOnboarding } from '../features/onboarding/index.ts';
import { CreateTripSheet, ExportScreen, JoinScreen, TodayScreen, TripScreen, TripsProvider, TripsScreen, useTrips } from '../features/trips/index.ts';
import { ScreenSkeleton } from '../shared/ui/Skeleton.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { TabBar } from './TabBar.tsx';
import { useDocumentScroll } from './useDocumentScroll.ts';
import { useScrollChrome } from './useScrollChrome.ts';
import { MobileMapControls } from './MobileMapControls.tsx';
import { initializeLook } from './look.ts';
import { RouteEscape } from './RouteEscape.tsx';
import { DeckSpotlightProvider } from '../features/discover/index.ts';

void initializeLook();

const DestinationPickerScreen = lazy(() => import('../features/discover/components/DestinationPickerScreen.tsx'));

/** Số nơi đã quẹt phải, để hiện trên tab "Đã chọn". */
function usePickedCount(): number {
  const { state } = useDiscover();
  return Object.values(state.decisions).filter(decision => decision === 'like').length;
}

/** Chế độ "thêm địa điểm vào chuyến" của bộ thẻ khi địa chỉ có mã chuyến; null nếu không có chuyến đó. */
function useAddingMode(tripId: string | null): AddingMode | undefined {
  const { trip, actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  const t = trip(tripId);
  if (!t) return undefined;
  return {
    title: t.name,
    excludeIds: t.items.flatMap((i) => (i.placeId ? [i.placeId] : [])),
    onAdd: (place) => {
      actions.addPlaces(t.id, [place]).then(() => toast.show(COPY.deck.addedToTrip)).catch(report);
    },
    onDone: () => navigate(VIEW.TRIP, t.id, 'ov'),
  };
}

/** Màn bộ thẻ: thêm vào chuyến khi có mã chuyến ở địa chỉ, ngược lại là khám phá bình thường. */
function DeckRoute({ destId, tripId }: { readonly destId: string; readonly tripId: string | null }) {
  const adding = useAddingMode(tripId);
  return <DeckScreen destId={destId} adding={adding} />;
}

/** Lần đầu mở ứng dụng ở trang Khám phá thì chuyển sang giới thiệu (một lần; `?intro=0` bỏ qua cho kiểm thử/liên kết sâu). Dùng `replaceState` để nút Back không quay lại vòng lặp. */
function useFirstRunIntro(view: string): void {
  const { state } = useOnboarding();
  const skip = /[?&]intro=0(&|$)/.test(window.location.search);
  useEffect(() => {
    if (view === VIEW.EXPLORE && !state.done && !skip) replaceRoute(VIEW.ONBOARD);
  }, [view, state.done, skip]);
}

/** Máy này bị thu hồi từ nơi khác (từng có phiên nhưng không còn trong danh sách thiết bị tin cậy): chuyển sang màn hết phiên (S19). */
function useExpiredGate(view: string): void {
  const expired = useSessionExpired();
  useEffect(() => {
    if (expired && view !== VIEW.EXPIRED && view !== VIEW.RECOVER) replaceRoute(VIEW.EXPIRED);
  }, [expired, view]);
}

/** Khung ứng dụng: chọn màn theo địa chỉ, ẩn/hiện thanh điều hướng theo cỡ màn và màn hiện tại; giữ tờ "Tạo chuyến đi" dùng chung. */
function Shell() {
  const route = useRoute();
  useFirstRunIntro(route.view);
  useExpiredGate(route.view);
  const wide = useIsWide();
  const { destId: currentDestId, destinations, select } = useCurrentDestination();
  const pickedCount = usePickedCount();
  const [create, setCreate] = useState<readonly PlaceView[] | null>(null);
  const hideBar = HIDE_TABBAR_ALWAYS.includes(route.view) || (!wide && HIDE_TABBAR_ON_PHONE.includes(route.view));
  const onMap = SHELL_MAP.VISIBLE_VIEWS.includes(route.view);
  const mapSheet = onMap && route.view !== VIEW.DECK;
  const documentScroll = !wide && (mapSheet || route.view === VIEW.DESTINATIONS);
  // Bản đồ khung chỉ tồn tại ở các màn nằm trên nó (Khám phá/Điểm đến/Đã chọn/Chuyến đi): bộ thẻ, chuyến chi tiết, Hôm nay, cài đặt… không giữ canvas WebGL ẩn.
  // Chế độ tờ chỉ có nghĩa trong màn đã đặt nó: đổi màn thì tờ tự mở lại (không cần effect).
  const routeKey = `${route.view}|${route.id ?? ''}`;
  const [sheetChoice, setSheetChoice] = useState<{ readonly view: string; readonly mode: SheetMode }>({ view: routeKey, mode: 'open' });
  // Xóa lựa chọn của màn cũ cả khi quay lại bằng Back, tránh mang trạng thái bản đồ mở về danh sách.
  if (sheetChoice.view !== routeKey) setSheetChoice({ view: routeKey, mode: 'open' });
  const sheet: SheetMode = sheetChoice.view === routeKey ? sheetChoice.mode : 'open';
  const setSheet = useCallback((mode: SheetMode): void => setSheetChoice({ view: routeKey, mode }), [routeKey]);
  useDocumentScroll(documentScroll, mapSheet && sheet === 'peek', routeKey);
  useScrollChrome(documentScroll && !(mapSheet && sheet === 'peek'), routeKey);
  useEffect(() => {
    if ((route.view === VIEW.DEST || route.view === VIEW.DECK) && route.id && route.id !== currentDestId && destinations.some((destination) => destination.id === route.id)) select(route.id);
  }, [route.view, route.id, currentDestId, destinations, select]);
  const destId = route.id ?? currentDestId;
  const sheetValue = useMemo(() => ({ mode: sheet, setMode: setSheet }), [sheet, setSheet]);
  return (
    <ShellSheetContext.Provider value={sheetValue}>
    <div className="app" data-surface={mapSheet ? 'sheet' : onMap ? 'deck' : 'page'} data-sheet={sheet} data-document-scroll={documentScroll || undefined}>
      {onMap ? <ShellMap view={route.view} sheet={sheet} documentScroll={documentScroll} /> : null}
      {onMap || route.view === VIEW.TRIP ? <MapChrome>{documentScroll && mapSheet ? <MobileMapControls open={sheet === 'peek'} onToggle={() => setSheet(sheet === 'peek' ? 'open' : 'peek')} /> : null}</MapChrome> : null}
      {documentScroll && mapSheet ? <button className="mobile-map-preview" type="button" onClick={() => setSheet('peek')} aria-label={COPY.map.preview}><span><Icon name="map-pin" />{COPY.map.preview}</span><small className="mobile-map-credit">{COPY.map.credit}</small></button> : null}
      <ScreenHost view={route.view} routeKey={routeKey} noBar={hideBar} inert={documentScroll && mapSheet && sheet === 'peek'}>
        <RouteEscape view={route.view} />
        {route.view === VIEW.ONBOARD ? <OnboardScreen /> : null}
        {route.view === VIEW.DESTINATIONS ? <Suspense fallback={<ScreenSkeleton />}><DestinationPickerScreen initialScope={route.id} /></Suspense> : null}
        {route.view === VIEW.EXPLORE ? <HomeScreen /> : null}
        {route.view === VIEW.DEST ? <DestScreen destId={destId} onCreate={() => setCreate([])} /> : null}
        {route.view === VIEW.DECK ? <DeckRoute key={destId} destId={destId} tripId={route.sub} /> : null}
        {route.view === VIEW.PICKED ? <PickedScreen key={currentDestId} destId={currentDestId} onSave={setCreate} /> : null}
        {route.view === VIEW.TRIPS ? <TripsScreen destId={currentDestId} /> : null}
        {route.view === VIEW.SECURITY ? <SecurityScreen /> : null}
        {route.view === VIEW.SETTINGS ? <SettingsScreen /> : null}
        {route.view === VIEW.EXPIRED ? <ExpiredScreen /> : null}
        {route.view === VIEW.TODAY ? <TodayScreen tripId={route.id} /> : null}
        {route.view === VIEW.EXPORT && route.id ? <ExportScreen tripId={route.id} /> : null}
        {route.view === VIEW.RECOVER ? <RecoverScreen /> : null}
        {route.view === VIEW.JOIN && route.id ? <JoinScreen code={route.id} /> : null}
        {route.view === VIEW.TRIP && route.id ? <TripScreen tripId={route.id} sub={route.sub} /> : null}
      </ScreenHost>
      {hideBar ? null : <TabBar current={route.view} wide={wide} pickedCount={pickedCount} onCreate={() => setCreate([])} />}
      {create ? <CreateTripSheet destId={currentDestId} picked={create} onClose={() => setCreate(null)} /> : null}
    </div>
    </ShellSheetContext.Provider>
  );
}

/** Gốc ứng dụng: cấp kho biên tập, trạng thái khám phá, kho chuyến đi, thông báo và tờ chi tiết cho mọi màn. */
export function App() {
  return (
    <ErrorBoundary>
      <DiscoverProvider>
        <CurrentDestinationProvider>
          <DiscoveryTopicProvider>
          <OnboardingProvider>
            <ToastProvider>
              <IdentityProvider>
                <TripsProvider>
                  <PlaceSheetProvider>
                    <DeckSpotlightProvider>
                    <Shell />
                    </DeckSpotlightProvider>
                  </PlaceSheetProvider>
                </TripsProvider>
              </IdentityProvider>
            </ToastProvider>
          </OnboardingProvider>
          </DiscoveryTopicProvider>
        </CurrentDestinationProvider>
      </DiscoverProvider>
    </ErrorBoundary>
  );
}
