import type { FeatureCollection, Point } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { HALF } from '../const/math.const.ts';
import { MAP } from './map.const.ts';
import { mapThumbnailUrl } from './mapThumbnailUrl.ts';
import type { MapMarker, MapMode } from './map.types.ts';

/** Chooses the catalog photo that was given to the pin; a missing photo uses a fallback circle, it does not guess a backend URL. */
export function markerThumbnail(marker: MapMarker): string {
  return mapThumbnailUrl(marker.thumb?.trim() ?? '');
}

/** Crops the center of a landscape/portrait photo into a 96 px square, not stretching by the source ratio. */
export function thumbnailCrop(width: number, height: number): [number, number, number, number, number, number, number, number] {
  const side = Math.min(width, height);
  return [(width - side) / HALF, (height - side) / HALF, side, side, 0, 0, MAP.THUMB_PX, MAP.THUMB_PX];
}

/** Keeps a stable ID and the longitude/latitude coordinates; a hub landmark is always outside the clustered source. */
export function markerFeatures(markers: readonly MapMarker[], mode: MapMode, clustered: boolean): FeatureCollection<Point> {
  return { type: 'FeatureCollection', features: markers
    .filter((marker) => (mode === 'browse' && marker.kind !== 'hub') === clustered)
    .map((marker) => ({ type: 'Feature', id: marker.id, geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
      properties: { id: marker.id, label: marker.label ?? '', num: marker.num == null ? '' : String(marker.num), muted: Boolean(marker.muted), hub: marker.kind === 'hub', ...(marker.kind === 'sticker' ? { sticker: true } : {}), image: markerThumbnail(marker) || MAP.EMPTY_IMAGE } })) };
}

/** Counts pins whose photo symbol resolves to the registered ID; it does not count an empty sprite, a cluster or a tile copy. */
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

/** The readable name of the canvas-replacement button, keeping the number and the id when the label is missing. */
export function markerAccessibleName(marker: MapMarker): string {
  return (marker.num == null ? '' : `${marker.num}. `) + (marker.label || marker.id);
}

/** The checkpoint is read only from the feature being drawn; it removes tile copies and keeps the center so e2e taps the real canvas. */
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
