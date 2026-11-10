import { useMemo } from 'react';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import type { ViewName } from '../../../shared/const/routes.const.ts';
import { useIsWide } from '../../../shared/hooks/useMediaQuery.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import { navigate, useRoute } from '../../../shared/router/hashRoute.ts';
import { useTrips } from '../../trips/index.ts';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import { useDestination } from '../hooks/useDestination.ts';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import type { SheetMode } from '../hooks/ShellSheetProvider.tsx';
import { SHELL_MAP } from '../model/shellMap.const.ts';
import { shellMapScene } from '../model/shellMapScene.ts';
import { useDiscoveryTopic } from '../hooks/DiscoveryTopicProvider.tsx';
import { matchesDiscoveryFilter } from '../model/discoveryFilters.ts';
import { useDeckSpotlight } from '../hooks/DeckSpotlightProvider.tsx';

/** Mã giữ chỗ cho tùy chọn `dest` của bản đồ: một bản đồ bền cho cả nước nên mã không đổi theo điểm đến (đổi mã sẽ hủy và dựng lại bản đồ). */
const SHELL_MAP_ID = 'vn';

/** Lề che bản đồ: màn rộng có bảng bên trái, điện thoại có bảng đáy (thu lại thì chỉ còn thanh tiêu đề). */
function useMapInsets(sheet: SheetMode, view: ViewName, documentScroll: boolean): { top: number; left: number; bottom: number } {
  const wide = useIsWide();
  return useMemo(() => {
    if (wide) return { top: SHELL_MAP.INSET_TOP_PX, left: SHELL_MAP.PANEL_INSET_PX, bottom: 0 };
    if (documentScroll) {
      const top = document.querySelector('.map-chrome')?.getBoundingClientRect().height ?? SHELL_MAP.DOCUMENT_HEADER_PX;
      return { top, left: 0, bottom: sheet === 'open' ? 0 : SHELL_MAP.PEEK_INSET_PX };
    }
    if (view === VIEW.EXPLORE) return { top: SHELL_MAP.INSET_TOP_PX, left: 0, bottom: sheet === 'peek' ? SHELL_MAP.PEEK_INSET_PX : Math.round(window.innerHeight * SHELL_MAP.HOME_SHEET_COVER_FRACTION) };
    if (view === VIEW.DECK) return { top: SHELL_MAP.INSET_TOP_PX, left: 0, bottom: 0 };
    const bottom = sheet === 'peek' ? SHELL_MAP.PEEK_INSET_PX : Math.round(window.innerHeight * SHELL_MAP.SHEET_OPEN_FRACTION);
    return { top: SHELL_MAP.INSET_TOP_PX, left: 0, bottom };
  }, [wide, sheet, view, documentScroll]);
}

/**
 * Bản đồ BỀN ở khung ứng dụng: một thể hiện MapLibre duy nhất nằm sau mọi màn, chỉ đổi cảnh (ghim + camera) theo màn hiện tại.
 * Ở màn khác che/có bản đồ riêng nó chỉ ẩn (không hủy) nên quay lại là có ngay, không tải lại. Không xin vị trí người dùng.
 * Chạm ghim: cảnh cả nước thì chọn điểm đến đó; cảnh điểm đến/đã chọn thì mở chi tiết nơi đó.
 */
export function ShellMap({ view, sheet, documentScroll = false }: { readonly view: ViewName; readonly sheet: SheetMode; readonly documentScroll?: boolean }) {
  const { destId, selectedId, destinations, select } = useCurrentDestination();
  const topic = useDiscoveryTopic();
  const { focus } = useDeckSpotlight();
  const { sub } = useRoute();
  const summaries = view === VIEW.EXPLORE ? topic.destinations : destinations;
  const { state: loaded } = useDestination(destId);
  const { state } = useDiscover();
  const place = usePlaceSheet();
  const { state: tripState } = useTrips();
  const insets = useMapInsets(sheet, view, documentScroll);
  const detail = useMemo(() => {
    if (loaded.status !== 'ready') return null;
    const places = loaded.data.places.filter(place => matchesDiscoveryFilter(place, sub));
    if (view === VIEW.DECK) {
      const active = focus?.destinationId === destId ? focus.placeId : null;
      return active ? { ...loaded.data, places: loaded.data.places.filter(place => place.id === active) } : loaded.data;
    }
    return view === VIEW.DEST && places.length ? { ...loaded.data, places } : loaded.data;
  }, [loaded, view, sub, focus, destId]);
  const pickedIds = useMemo(() => new Set(Object.entries(state.decisions).filter(([, decision]) => decision === 'like').map(([id]) => id)), [state.decisions]);
  const trips = useMemo(() => tripState.trips.map((trip) => ({ id: trip.id, name: trip.name, destinationId: trip.destinationId })), [tripState.trips]);
  const scene = useMemo(() => shellMapScene({ view, selectedId, destId, summaries, detail, pickedIds, trips }), [view, selectedId, destId, summaries, detail, pickedIds, trips]);
  // Đối tượng vừa khung MỚI mỗi khi cảnh dựng lại hoặc tờ thu/mở (lề đổi → camera bay lại để ghim ra giữa phần bản đồ lộ ra); render lại thường thì giữ nguyên.
  const fit = useMemo(() => (scene.fit ? { ...scene.fit } : null), [scene, sheet]); // eslint-disable-line react-hooks/exhaustive-deps -- `sheet` chỉ để làm mới yêu cầu vừa khung
  const hidden = scene.kind === 'hidden';
  /** Chạm một ghim: điểm đến → mở trang điểm đến đó; chuyến → mở chuyến; nơi → mở chi tiết. */
  function onPin(id: string): void {
    if (scene.kind === 'overview') {
      select(id);
      navigate(VIEW.DEST, id);
    } else if (scene.kind === 'trips') navigate(VIEW.TRIP, id, 'ov');
    else place.open(id, view === VIEW.DECK && sub ? { noDecide: true } : undefined);
  }
  return (
    <div className="shell-map" data-scene={scene.kind} aria-hidden={hidden || (documentScroll && sheet === 'open') || undefined} inert={hidden || (documentScroll && sheet === 'open')}>
      <TerrainMapView className="shell-map-view" dest={SHELL_MAP_ID} label={COPY.map.shell} markers={scene.markers} fit={fit} insets={insets} creditBand={false} selected={place.placeId} onPin={onPin} />
    </div>
  );
}
