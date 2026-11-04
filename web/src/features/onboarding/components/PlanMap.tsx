import { useMemo } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { MapMarker, MapRoute } from '../../../shared/map/map.types.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { MapHealth } from '../hooks/useMapHealth.ts';
import { MAP_PADDING } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import { SchematicMap } from './SchematicMap.tsx';

interface PlanMapProps {
  readonly destId: string;
  readonly markers: readonly MapMarker[];
  readonly route: MapRoute | null;
  /** Mã ghim cần vừa khung (null = cả chuyến). */
  readonly focus: readonly string[] | null;
  /** Khung chứa (để theo dõi bản đồ) và tình trạng bản đồ do cảnh theo dõi, vì kịch bản của cảnh cần chờ bản đồ sẵn sàng. */
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly health: MapHealth;
  /** Lớp phủ riêng của cảnh (nút Chia sẻ, nhãn minh họa…). */
  readonly children?: ReactNode;
}

/** Bản đồ lịch trình: bản đồ thật của app (có ghim ảnh, số, tuyến), hiện "Đang tải…" trong lúc chờ và đổi sang sơ đồ minh họa khi nền lỗi; luôn kèm nhãn "Thứ tự ghé thăm". */
export function PlanMap({ destId, markers, route, focus, hostRef, health, children }: PlanMapProps) {
  const fit = useMemo<MapFit>(() => ({ ids: focus ? [...focus] : null, options: { animate: true, padding: MAP_PADDING } }), [focus]);
  return (
    <div ref={hostRef} className="ob-map">
      {health.state === 'fallback' ? (
        <SchematicMap markers={markers} route={route} focus={focus} label={T.trip.mapLabel} />
      ) : (
        <TerrainMapView dest={destId} label={T.trip.mapLabel} markers={markers} route={route} mode="route" fit={fit} interactive={false} towns={false} credit={false} />
      )}
      {health.state === 'loading' ? <p className="ob-maploading" role="status">{T.trip.mapLoading}</p> : null}
      {health.state === 'fallback' ? <p className="ob-mapnote" role="status">{T.trip.mapFallback}</p> : null}
      <p className="ob-maporder">{T.trip.order}</p>
      {children}
    </div>
  );
}
