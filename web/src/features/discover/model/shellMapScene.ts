import { VIEW } from '../../../shared/const/routes.const.ts';
import type { ViewName } from '../../../shared/const/routes.const.ts';
import type { MapMarker } from '../../../shared/map/map.types.ts';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { DestinationDetail, DestinationSummary } from './Catalog.types.ts';
import { numberedMarkers, placeMarkers } from './mapMarkers.ts';
import { SHELL_MAP } from './shellMap.const.ts';
import { VIETNAM_ARCHIPELAGO_LABELS } from '../../../shared/map/vietnamLabels.const.ts';

/** Loại cảnh của bản đồ khung: cả nước, một điểm đến, các nơi đã chọn, các chuyến của bạn, hoặc ẩn (màn khác che hoặc có bản đồ riêng). */
export type ShellSceneKind = 'overview' | 'destination' | 'picked' | 'trips' | 'hidden';

/** Một cảnh bản đồ: ghim cần vẽ, cách vừa khung camera và khóa đổi khi camera phải bay lại. */
export interface ShellMapScene {
  readonly kind: ShellSceneKind;
  readonly markers: readonly MapMarker[];
  readonly fit: MapFit | null;
  readonly key: string;
}

/** Phần dữ liệu của một chuyến mà bản đồ cần: mã, tên và điểm đến nó thuộc về. */
export interface ShellTripRef {
  readonly id: string;
  readonly name: string;
  readonly destinationId: string;
}

/** Dữ liệu đầu vào để chọn cảnh: màn hiện tại và dữ liệu danh mục/lựa chọn/chuyến đã có. */
export interface ShellMapInput {
  readonly view: ViewName;
  readonly selectedId: string | null;
  readonly destId: string;
  readonly summaries: readonly DestinationSummary[];
  readonly detail: DestinationDetail | null;
  readonly pickedIds: ReadonlySet<string>;
  /** Các chuyến của người dùng (đã tải); rỗng thì màn Chuyến đi quay về cảnh cả nước. */
  readonly trips: readonly ShellTripRef[];
}

/** Yêu cầu vừa khung MỚI mỗi lần (TerrainMapView chạy lại vừa khung khi đối tượng đổi): camera bay lại khi cảnh được dựng lại, không phải khi chỉ render lại. */
const overviewFit = (): MapFit => ({ ids: null, options: { padding: SHELL_MAP.OVERVIEW_PADDING_PX, maxZoom: SHELL_MAP.OVERVIEW_MAX_ZOOM, contextPoints: VIETNAM_ARCHIPELAGO_LABELS.map(label => label.coordinates) } });
const destinationFit = (): MapFit => ({ ids: null, options: { padding: SHELL_MAP.FIT_PADDING_PX } });

/** Ghim mỗi điểm đến có tọa độ (ảnh bìa + tên) cho cảnh cả nước; nơi chưa có tọa độ không bị bịa vị trí. */
function destinationMarkers(summaries: readonly DestinationSummary[]): MapMarker[] {
  return summaries
    .filter((d) => d.lat != null && d.lon != null)
    .map((d) => {
      return { id: d.id, lat: d.lat as number, lon: d.lon as number, label: d.name, ...(d.coverUrl ? { thumb: d.coverUrl } : {}) };
    });
}

/** Mỗi chuyến một ghim đặt tại tọa độ điểm đến của nó (ảnh bìa điểm đến + tên chuyến); chuyến của điểm đến chưa có tọa độ không có ghim. */
function tripMarkers(trips: readonly ShellTripRef[], summaries: readonly DestinationSummary[]): MapMarker[] {
  const byId = new Map(summaries.map((d) => [d.id, d] as const));
  return trips.flatMap((trip) => {
    const dest = byId.get(trip.destinationId);
    if (!dest || dest.lat == null || dest.lon == null) return [];
    return [{ id: trip.id, lat: dest.lat, lon: dest.lon, label: trip.name, ...(dest.coverUrl ? { thumb: dest.coverUrl } : {}) }];
  });
}

/** Dựng cảnh từ loại, mã điểm đến và ghim; khóa gồm cả tập ghim để camera vừa khung lại khi tập đổi. */
function scene(kind: ShellSceneKind, scope: string, markers: readonly MapMarker[], fit: MapFit | null): ShellMapScene {
  return { kind, markers, fit, key: `${kind}|${scope}|${markers.map((m) => m.id).join(',')}` };
}

/** Cảnh của một điểm đến: ghim các nơi có tọa độ; chưa tải xong chi tiết thì chưa có ghim. */
function destinationScene(input: ShellMapInput): ShellMapScene {
  const markers = input.detail ? placeMarkers(input.detail.places) : [];
  return scene('destination', input.destId, markers, input.view === VIEW.DECK ? { ids: null, options: { maxZoom: 10 } } : destinationFit());
}

/**
 * Chọn cảnh bản đồ khung theo màn. Bản đồ là MỘT thể hiện bền ở khung ứng dụng; màn chỉ đổi cảnh (ghim + camera), không tạo bản đồ mới.
 * Chuyến đi: ghim theo từng chuyến thật. Bộ thẻ, chuyến chi tiết, hôm nay, cài đặt… không dùng bản đồ khung (cảnh `hidden`; khung ứng dụng không dựng canvas cho các màn đó).
 */
export function shellMapScene(input: ShellMapInput): ShellMapScene {
  if (!SHELL_MAP.VISIBLE_VIEWS.includes(input.view)) return scene('hidden', '', [], null);
  if (input.view === VIEW.EXPLORE) return scene('overview', '', destinationMarkers(input.summaries), overviewFit());
  if (input.view === VIEW.TRIPS) {
    const markers = tripMarkers(input.trips, input.summaries);
    return markers.length > 0 ? scene('trips', '', markers, overviewFit()) : scene('overview', '', destinationMarkers(input.summaries), overviewFit());
  }
  if (input.view === VIEW.PICKED && input.detail) {
    const chosen = input.detail.places.filter((p) => input.pickedIds.has(p.id));
    if (chosen.length > 0) return scene('picked', input.destId, numberedMarkers(chosen), destinationFit());
  }
  return destinationScene(input);
}
