import { useMemo } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { roadKmBetween } from '../../../shared/lib/geo.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { MapMarker } from '../../../shared/map/map.types.ts';
import { firstPhotoUrl } from '../../discover/index.ts';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { dayItems } from '../model/tripMath.ts';
import { coordOf, itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

interface TripMapProps {
  /** Phần tờ kéo che bản đồ (px) để camera chừa chỗ; 0 khi tờ là cột bên (màn ≥ 1280 px). */
  readonly coveredBottom: number;
}

const TOP_INSET = 56;
/** Tuyến cần ít nhất hai điểm. */
const MIN_ROUTE_POINTS = 2;

/**
 * Bản đồ của chuyến: tổng quan = mọi mục có tọa độ (chưa có ngày thì mờ); tab ngày = mục của ngày đánh số, nối tuyến kèm km, mục khác mờ.
 * Đổi tab chỉ bay camera, không dựng lại bản đồ.
 */
export function TripMap({ coveredBottom }: TripMapProps) {
  const { trip, cat, days, tab, openItem } = useTripView();
  const dayIndex = tab === 'ov' ? -1 : Number(tab) - 1;
  const day = days[dayIndex];
  const inDay = useMemo(() => (day ? dayItems(trip, day).filter((i) => i.placeId && coordOf(cat)(i.placeId)) : []), [trip, cat, day]);

  const markers = useMemo<MapMarker[]>(() => {
    const dayIds = day ? dayItems(trip, day).map((i) => i.id) : null;
    return trip.items.flatMap((i) => {
      const p = cat.place(i.placeId);
      if (!p || p.lat === null || p.lon === null) return [];
      const idx = dayIds ? dayIds.indexOf(i.id) : -1;
      return [{ id: i.id, lat: p.lat, lon: p.lon, label: itemName(i, cat), thumb: firstPhotoUrl(p), ...(idx >= 0 ? { num: idx + 1 } : {}), muted: dayIds ? idx < 0 : i.day === null }];
    });
  }, [trip, cat, day]);

  const route = useMemo(() => {
    if (inDay.length < MIN_ROUTE_POINTS) return null;
    const coord = coordOf(cat);
    const labels = inDay.slice(1).map((i, k) => {
      const a = coord(inDay[k]?.placeId as string);
      const b = coord(i.placeId as string);
      return a && b ? fill(COPY.units.kmApprox, { km: Math.round(roadKmBetween(a, b)) }) : '';
    });
    return { ids: inDay.map((i) => i.id), labels };
  }, [inDay, cat]);

  const fitKey = dayIndex < 0 ? '' : inDay.map((i) => i.id).join(',');
  const fit = useMemo<MapFit>(() => ({ ids: dayIndex < 0 ? null : fitKey.split(',').filter(Boolean), options: { animate: true } }), [dayIndex, fitKey]);
  const insets = useMemo(() => (coveredBottom ? { bottom: coveredBottom, top: TOP_INSET } : {}), [coveredBottom]);

  return <TerrainMapView className="tmap" dest={cat.dest.id} label={T.view.mapLabel} markers={markers} route={route} mode={dayIndex < 0 ? 'browse' : 'route'} insets={insets} fit={fit} onPin={openItem} />;
}
