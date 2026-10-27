import { useCallback, useEffect, useRef, useState } from 'react';
import { TerrainMap } from './TerrainMap.ts';
import type { FitOptions, Insets, MapMarker, MapMode, MapRoute } from './map.types.ts';

/** Yêu cầu vừa khung: các ghim (null = tất cả) và tùy chọn. Người gọi nên `useMemo` để không vừa khung lại mỗi lần render. */
export interface MapFit {
  readonly ids: readonly string[] | null;
  readonly options?: FitOptions;
}

interface TerrainMapViewProps {
  readonly dest: string;
  /** Nhãn truy cập của vùng bản đồ (đọc bởi trình đọc màn hình). */
  readonly label: string;
  readonly markers: readonly MapMarker[];
  readonly route?: MapRoute | null;
  readonly mode?: MapMode;
  readonly insets?: Partial<Insets>;
  readonly fit?: MapFit | null;
  readonly selected?: string | null;
  readonly interactive?: boolean;
  readonly towns?: boolean;
  readonly credit?: boolean;
  readonly onPin?: (id: string) => void;
  readonly className?: string;
}

const NO_ROUTE_LABELS: readonly string[] = [];

/**
 * Vùng bản đồ địa hình dùng trong React. Bản đồ là đối tượng mệnh lệnh (`TerrainMap`) sống theo vòng đời của phần tử:
 * tạo khi phần tử vào DOM, hủy khi rời; các thuộc tính (ghim, tuyến, chế độ, vừa khung) được đẩy vào bằng effect.
 */
export function TerrainMapView({ dest, label, markers, route = null, mode = 'browse', insets, fit = null, selected = null, interactive = true, towns = true, credit = true, onPin, className }: TerrainMapViewProps) {
  const [map, setMap] = useState<TerrainMap | null>(null);
  const onPinRef = useRef(onPin);
  useEffect(() => {
    onPinRef.current = onPin;
  });

  const attach = useCallback(
    /** Tạo bản đồ khi phần tử vào DOM; trả hàm hủy khi phần tử rời (ref callback có dọn dẹp của React 19). */
    (el: HTMLDivElement | null) => {
      if (!el) return undefined;
      const m = new TerrainMap(el, { dest, label, interactive, towns, credit, onPin: (id) => onPinRef.current?.(id) });
      setMap(m);
      return () => {
        m.destroy();
        setMap(null);
      };
    },
    [dest, label, interactive, towns, credit],
  );

  useEffect(() => {
    map?.setMode(mode);
  }, [map, mode]);
  useEffect(() => {
    if (insets) map?.setInsets(insets);
  }, [map, insets]);
  useEffect(() => {
    map?.setMarkers(markers);
  }, [map, markers]);
  useEffect(() => {
    map?.setRoute(route ? route.ids : null, route?.labels ?? NO_ROUTE_LABELS);
  }, [map, route]);
  useEffect(() => {
    map?.select(selected);
  }, [map, selected]);
  useEffect(() => {
    if (fit) map?.fitTo(fit.ids, fit.options);
  }, [map, fit]);

  return <div ref={attach} className={className} />;
}
