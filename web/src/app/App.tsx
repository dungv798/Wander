import { lazy, Suspense, useEffect, useState } from 'react';
import { COPY } from '../shared/const/copy.vi.ts';
import { HIDE_TABBAR_ALWAYS, HIDE_TABBAR_ON_PHONE, VIEW } from '../shared/const/routes.const.ts';
import { useIsWide } from '../shared/hooks/useMediaQuery.ts';
import { navigate, replaceRoute, useRoute } from '../shared/router/hashRoute.ts';
import { ScreenHost } from '../shared/ui/ScreenHost.tsx';
import { ToastProvider, useToast } from '../shared/ui/Toast.tsx';
import { CurrentDestinationProvider, useCurrentDestination, DeckScreen, DestScreen, DiscoverProvider, HomeScreen, PickedScreen, PlaceSheetProvider, useDiscover, useDestination, pickedOf } from '../features/discover/index.ts';
import type { AddingMode, PlaceView } from '../features/discover/index.ts';
import { ExpiredScreen, IdentityProvider, RecoverScreen, SecurityScreen, useReportError, useSessionExpired } from '../features/identity/index.ts';
import { SettingsScreen } from '../features/settings/index.ts';
import { OnboardScreen, OnboardingProvider, useOnboarding } from '../features/onboarding/index.ts';
import { TemplatesSection } from '../features/templates/index.ts';
import { CreateTripSheet, ExportScreen, JoinScreen, TodayScreen, TripScreen, TripsProvider, TripsScreen, useTrips } from '../features/trips/index.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { TabBar } from './TabBar.tsx';

const DestinationPickerScreen = lazy(() => import('../features/discover/components/DestinationPickerScreen.tsx'));

/** Số nơi đã quẹt phải, để hiện trên tab "Đã chọn". */
function usePickedCount(destId: string): number {
  const { state } = useDiscover();
  const { state: destination } = useDestination(destId);
  return destination.status === 'ready' ? pickedOf(state, destination.data.places).length : 0;
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
  const pickedCount = usePickedCount(currentDestId);
  const [create, setCreate] = useState<readonly PlaceView[] | null>(null);
  const hideBar = HIDE_TABBAR_ALWAYS.includes(route.view) || (!wide && HIDE_TABBAR_ON_PHONE.includes(route.view));
  useEffect(() => {
    if ((route.view === VIEW.DEST || route.view === VIEW.DECK) && route.id && route.id !== currentDestId && destinations.some((destination) => destination.id === route.id)) select(route.id);
  }, [route.view, route.id, currentDestId, destinations, select]);
  const destId = route.id ?? currentDestId;
  return (
    <div className="app">
      <ScreenHost view={route.view} routeKey={`${route.view}|${route.id ?? ''}`} noBar={hideBar}>
        {route.view === VIEW.ONBOARD ? <OnboardScreen /> : null}
        {route.view === VIEW.DESTINATIONS ? <Suspense fallback={<p role="status">{COPY.common.loading}</p>}><DestinationPickerScreen /></Suspense> : null}
        {route.view === VIEW.EXPLORE ? <HomeScreen key={currentDestId} destId={currentDestId} extra={<TemplatesSection destId={currentDestId} />} /> : null}
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
      {hideBar ? null : <TabBar current={route.view} wide={wide} pickedCount={pickedCount} />}
      {create ? <CreateTripSheet destId={currentDestId} picked={create.map((p) => ({ id: p.id, category: p.category, name: p.name }))} onClose={() => setCreate(null)} /> : null}
    </div>
  );
}

/** Gốc ứng dụng: cấp kho biên tập, trạng thái khám phá, kho chuyến đi, thông báo và tờ chi tiết cho mọi màn. */
export function App() {
  return (
    <ErrorBoundary>
      <DiscoverProvider>
        <CurrentDestinationProvider>
          <OnboardingProvider>
            <ToastProvider>
              <IdentityProvider>
                <TripsProvider>
                  <PlaceSheetProvider>
                    <Shell />
                  </PlaceSheetProvider>
                </TripsProvider>
              </IdentityProvider>
            </ToastProvider>
          </OnboardingProvider>
        </CurrentDestinationProvider>
      </DiscoverProvider>
    </ErrorBoundary>
  );
}
