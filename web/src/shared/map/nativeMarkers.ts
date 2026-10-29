import type { FeatureCollection, Point } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { HALF } from '../const/math.const.ts';
import { MAP } from './map.const.ts';
import type { MapMarker, MapMode } from './map.types.ts';

/** Chọn ảnh catalog đã cấp cho ghim; thiếu ảnh dùng vòng tròn dự phòng, không đoán URL backend. */
export function markerThumbnail(marker: MapMarker): string {
  return marker.thumb?.trim() ?? '';
}

/** Cắt chính giữa ảnh ngang/dọc thành hình vuông 96 px, không kéo méo theo tỉ lệ nguồn. */
export function thumbnailCrop(width: number, height: number): [number, number, number, number, number, number, number, number] {
  const side = Math.min(width, height);
  return [(width - side) / HALF, (height - side) / HALF, side, side, 0, 0, MAP.THUMB_PX, MAP.THUMB_PX];
}

/** Giữ ID ổn định và tọa độ kinh/vĩ độ; mốc hub luôn nằm ngoài nguồn gộp cụm. */
export function markerFeatures(markers: readonly MapMarker[], mode: MapMode, clustered: boolean): FeatureCollection<Point> {
  return { type: 'FeatureCollection', features: markers
    .filter((marker) => (mode === 'browse' && marker.kind !== 'hub') === clustered)
    .map((marker) => ({ type: 'Feature', id: marker.id, geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
      properties: { id: marker.id, label: marker.label ?? '', num: marker.num == null ? '' : String(marker.num), muted: Boolean(marker.muted), hub: marker.kind === 'hub', image: markerThumbnail(marker) || MAP.EMPTY_IMAGE } })) };
}

/** Đếm ghim có symbol ảnh resolve đúng ID đã đăng ký; không đếm sprite rỗng, cụm hoặc bản sao tile. */
export function renderedImageCount(features: readonly Pick<MapGeoJSONFeature, 'properties' | 'layer'>[], hasImage: (id: string) => boolean): number {
  const ids = new Set<string>();
  features.forEach((feature) => {
    if (feature.layer.type !== 'symbol' || feature.properties['cluster']) return;
    const resolved: unknown = feature.layer.layout?.['icon-image'];
    if (resolved && typeof resolved === 'object' && 'available' in resolved && !resolved.available) return;
    const name = typeof resolved === 'string' ? resolved : resolved && typeof resolved === 'object' && 'name' in resolved ? resolved.name : null;
    if (typeof name === 'string' && name !== MAP.EMPTY_IMAGE && name === feature.properties['image'] && hasImage(name)) ids.add(String(feature.properties['id']));
  });
  return ids.size;
}

/** Tên đọc của nút thay thế canvas, giữ số thứ tự và mã khi thiếu nhãn. */
export function markerAccessibleName(marker: MapMarker): string {
  return (marker.num == null ? '' : `${marker.num}. `) + (marker.label || marker.id);
}

/** Điểm kiểm chỉ đọc từ feature đang vẽ; loại bản sao tile và giữ tâm để e2e chạm canvas thật. */
export function markerSnapshot(features: readonly Pick<MapGeoJSONFeature, 'geometry' | 'properties'>[], project: (coordinates: [number, number]) => { x: number; y: number }, selected: string | null) {
  const seen = new Set<string>();
  const points = features.flatMap((feature) => {
    if (feature.geometry.type !== 'Point') return [];
    const cluster = Boolean(feature.properties['cluster']);
    const id = String(cluster ? feature.properties['cluster_id'] : feature.properties['id']);
    const key = `${cluster}:${id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const [lon = 0, lat = 0] = feature.geometry.coordinates;
    const point = project([lon, lat]);
    return [{ id, cluster, x: Number(point.x.toFixed(MAP.COORD_DIGITS)), y: Number(point.y.toFixed(MAP.COORD_DIGITS)) }];
  });
  return { pins: String(points.filter((point) => !point.cluster).length), clusters: String(points.filter((point) => point.cluster).length), selected: selected ?? '', features: JSON.stringify(points) };
}
