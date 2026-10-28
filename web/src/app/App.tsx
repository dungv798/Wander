import { useEffect, useState } from 'react';
import { COPY } from '../shared/const/copy.vi.ts';
import { DEFAULT_DESTINATION_ID, HIDE_TABBAR_ALWAYS, HIDE_TABBAR_ON_PHONE, VIEW } from '../shared/const/routes.const.ts';
import { useIsWide } from '../shared/hooks/useMediaQuery.ts';
import { navigate, replaceRoute, useRoute } from '../shared/router/hashRoute.ts';
import { ScreenHost } from '../shared/ui/ScreenHost.tsx';
import { ToastProvider, useToast } from '../shared/ui/Toast.tsx';
import { DeckScreen, DestScreen, DiscoverProvider, HomeScreen, PickedScreen, PlaceSheetProvider, useDiscover } from '../features/discover/index.ts';
import type { AddingMode, PlaceView } from '../features/discover/index.ts';
import { ExpiredScreen, IdentityProvider, RecoverScreen, SecurityScreen, useReportError, useSessionExpired } from '../features/identity/index.ts';
import { SettingsScreen } from '../features/settings/index.ts';
import { OnboardScreen, OnboardingProvider, useOnboarding } from '../features/onboarding/index.ts';
import { TemplatesSection } from '../features/templates/index.ts';
import { CreateTripSheet, ExportScreen, JoinScreen, TodayScreen, TripScreen, TripsProvider, TripsScreen, useTrips } from '../features/trips/index.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { TabBar } from './TabBar.tsx';

/** Số nơi đã quẹt phải, để hiện trên tab "Đã chọn". */
function usePickedCount(): number {
  const { state } = useDiscover();
  return Object.values(state.decisions).filter((d) => d === 'like').length;
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
  const pickedCount = usePickedCount();
  const [create, setCreate] = useState<readonly PlaceView[] | null>(null);
  const hideBar = HIDE_TABBAR_ALWAYS.includes(route.view) || (!wide && HIDE_TABBAR_ON_PHONE.includes(route.view));
  const destId = route.id ?? DEFAULT_DESTINATION_ID;
  return (
    <div className="app">
      <ScreenHost view={route.view} routeKey={`${route.view}|${route.id ?? ''}`} noBar={hideBar}>
        {route.view === VIEW.ONBOARD ? <OnboardScreen /> : null}
        {route.view === VIEW.EXPLORE ? <HomeScreen destId={DEFAULT_DESTINATION_ID} extra={<TemplatesSection destId={DEFAULT_DESTINATION_ID} />} /> : null}
        {route.view === VIEW.DEST ? <DestScreen destId={destId} onCreate={() => setCreate([])} /> : null}
        {route.view === VIEW.DECK ? <DeckRoute destId={destId} tripId={route.sub} /> : null}
        {route.view === VIEW.PICKED ? <PickedScreen destId={DEFAULT_DESTINATION_ID} onSave={setCreate} /> : null}
        {route.view === VIEW.TRIPS ? <TripsScreen destId={DEFAULT_DESTINATION_ID} /> : null}
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
      {create ? <CreateTripSheet destId={DEFAULT_DESTINATION_ID} picked={create.map((p) => ({ id: p.id, category: p.category, name: p.name }))} onClose={() => setCreate(null)} /> : null}
    </div>
  );
}

/** Gốc ứng dụng: cấp kho biên tập, trạng thái khám phá, kho chuyến đi, thông báo và tờ chi tiết cho mọi màn. */
export function App() {
  return (
    <ErrorBoundary>
      <DiscoverProvider>
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
      </DiscoverProvider>
    </ErrorBoundary>
  );
}
