import { useCallback, useMemo, useState } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { RoutePreview } from '../../../shared/map/RoutePreview.tsx';
import { routeSegmentsForDays } from '../../../shared/map/routeSegments.ts';
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
  const [selection, setSelection] = useState<{ tab: string; pin?: string; segment?: string } | null>(null);
  /** Đóng đối tượng đang chọn mà không thay đổi dữ liệu chuyến. */
  const close = useCallback(() => setSelection(null), []);
  const dayIndex = tab === 'ov' ? -1 : Number(tab) - 1;
  const day = days[dayIndex];
  const inDay = useMemo(() => (day ? dayItems(trip, day).filter((i) => i.placeId && coordOf(cat)(i.placeId)) : []), [trip, cat, day]);

  const markers = useMemo<MapMarker[]>(() => {
    const dayIds = day ? dayItems(trip, day).map((i) => i.id) : null;
    const ordered = day ? [...dayItems(trip, day), ...trip.items.filter((item) => item.day !== day)] : trip.items;
    return ordered.flatMap((i) => {
      const p = cat.place(i.placeId);
      if (!p || p.lat === null || p.lon === null) return [];
      const idx = dayIds ? dayIds.indexOf(i.id) : -1;
      return [{ id: i.id, lat: p.lat, lon: p.lon, label: itemName(i, cat), thumb: firstPhotoUrl(p), ...(idx >= 0 ? { num: idx + 1 } : {}), muted: dayIds ? idx < 0 : i.day === null }];
    });
  }, [trip, cat, day]);

  const segments = useMemo(() => routeSegmentsForDays(days.map((date) => dayItems(trip, date).filter((item) => item.placeId).map((item) => item.id)), markers), [trip, days, markers]);
  const route = useMemo(() => {
    const parts = segments.filter((segment) => dayIndex < 0 || segment.day === dayIndex);
    const ids = [...new Set(parts.flatMap((segment) => [segment.from, segment.to]))];
    if (ids.length < MIN_ROUTE_POINTS) return null;
    return { ids, segments: parts, labels: parts.map((segment) => fill(COPY.map.routeEstimate, { km: Math.max(1, Math.round(segment.km)) })), ...(day ? { viewKey: trip.id + ':' + day } : {}) };
  }, [segments, dayIndex, day, trip.id]);

  const fitKey = dayIndex < 0 ? '' : inDay.map((i) => i.id).join(',');
  const fit = useMemo<MapFit>(() => ({ ids: dayIndex < 0 ? null : fitKey.split(',').filter(Boolean), options: { animate: true, keepIfVisible: true } }), [dayIndex, fitKey]);
  const insets = useMemo(() => (coveredBottom ? { bottom: coveredBottom, top: TOP_INSET } : {}), [coveredBottom]);

  const active = selection?.tab === tab ? selection : null;
  const segment = route?.segments.find((part) => part.id === active?.segment);
  const pinId = active?.pin ?? segment?.from;
  const marker = markers.find((point) => point.id === pinId);
  const item = trip.items.find((point) => point.id === pinId);
  const next = segment ?? segments.find((part) => part.from === pinId);

  return <><TerrainMapView className="tmap" dest={cat.dest.id} label={T.view.mapLabel} markers={markers} route={route} mode="route" insets={insets} fit={fit} selected={active?.pin ?? null} selectedSegment={segment?.id ?? null} onPin={(id) => setSelection({ tab, pin: id })} onSegment={(id) => setSelection({ tab, segment: id })} onMapDismiss={close} />
    {marker && <RoutePreview name={marker.label ?? marker.id} thumb={marker.thumb} time={item?.timeOfDay} km={next?.km} onClose={close} onDetails={() => { close(); openItem(marker.id); }} />}
  </>;
}
