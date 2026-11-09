import type { Map as MlMap, FilterSpecification } from 'maplibre-gl';
import { MAP } from './map.const.ts';
import { cssColorToRgb } from './mapUtil.ts';

/** Đọc token hiện tại thành màu RGB cho lớp GL, không sao chép bảng màu CSS. */
export function pinColor(host: HTMLElement, token: string): string {
  const rgb = cssColorToRgb(getComputedStyle(host).getPropertyValue(token).trim());
  return `rgb(${rgb.map((value) => Math.round(value * MAP.RGB_MAX)).join(',')})`;
}

/** Các lớp hình học để query hit và điểm kiểm; nhãn không mở thêm một đối tượng. */
export function pinHitLayers(): string[] {
  return [MAP.CLUSTER_LAYER, ...MAP.PIN_SOURCES.map((_, index) => `${MAP.PIN_LAYER_PREFIX}${index}-hit`)];
}

/** Dựng ghim native; giữ ID ảnh chưa tải làm phụ thuộc tile, không coalesce sang sprite rỗng làm mất ảnh đến muộn. */
function addPinSourceLayers(map: MlMap, host: HTMLElement, source: string, index: number): void {
  const prefix = `${MAP.PIN_LAYER_PREFIX}${index}`;
  const filter: FilterSpecification = ['!', ['has', 'point_count']];
  const color = pinColor(host, '--map-pin');
  const white = pinColor(host, '--white');
  map.addLayer({ id: `${prefix}-hit`, type: 'circle', source, filter, paint: { 'circle-radius': MAP.PIN_RADIUS, 'circle-opacity': 0 } });
  map.addLayer({ id: `${prefix}-circle`, type: 'circle', source, filter, paint: {
    'circle-radius': ['case', ['get', 'hub'], MAP.HUB_RADIUS, ['get', 'muted'], MAP.PIN_RADIUS * MAP.MUTED_SCALE, MAP.PIN_RADIUS],
    'circle-color': ['case', ['get', 'hub'], pinColor(host, '--ink-fixed'), ['boolean', ['get', 'sticker'], false], white, ['get', 'muted'], pinColor(host, '--map-pin-muted'), color],
    'circle-opacity': ['case', ['get', 'muted'], MAP.MUTED_OPACITY, 1],
    'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], color, white],
    'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], MAP.SELECT_BORDER, MAP.PIN_BORDER],
  } });
  map.addLayer({ id: `${prefix}-photo`, type: 'symbol', source, filter, layout: {
    'icon-image': ['image', ['get', 'image']], 'icon-size': ['case', ['get', 'muted'], MAP.MUTED_SCALE, 1],
    'icon-allow-overlap': true, 'icon-ignore-placement': true,
  }, paint: { 'icon-opacity': ['case', ['get', 'muted'], MAP.MUTED_OPACITY, 1] } });
  map.addLayer({ id: `${prefix}-number`, type: 'symbol', source, filter, layout: {
    'text-field': ['get', 'num'], 'text-font': [...MAP.FONT], 'text-size': MAP.NUMBER_SIZE, 'text-allow-overlap': true, 'text-ignore-placement': true,
  }, paint: { 'text-color': white, 'text-halo-color': color, 'text-halo-width': MAP.TEXT_HALO } });
  map.addLayer({ id: `${prefix}-label`, type: 'symbol', source, filter: ['all', filter, ['any', ['!', ['get', 'muted']], ['==', ['get', 'id'], '']]], layout: {
    'text-field': ['get', 'label'], 'text-font': [...MAP.FONT], 'text-size': MAP.LABEL_SIZE, 'text-max-width': MAP.LABEL_MAX_WIDTH, 'text-anchor': 'top', 'text-offset': [0, MAP.LABEL_OFFSET],
  }, paint: { 'text-color': pinColor(host, '--map-label'), 'text-halo-color': white, 'text-halo-width': MAP.TEXT_HALO } });
}

/** Nguồn gộp cụm dùng riêng cho duyệt; nguồn thường dành cho hub và chế độ tuyến. */
export function addNativePinLayers(map: MlMap, host: HTMLElement): void {
  if (!map.hasImage(MAP.EMPTY_IMAGE)) map.addImage(MAP.EMPTY_IMAGE, { width: 1, height: 1, data: new Uint8Array(MAP.IMAGE_CHANNELS) });
  MAP.PIN_SOURCES.forEach((source, index) => {
    map.addSource(source, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: index === 0, clusterProperties: { image: ['coalesce', ['get', 'image']] }, clusterRadius: MAP.CLUSTER_PX, clusterMaxZoom: MAP.GL_MAX_ZOOM - 1 });
  });
  map.addLayer({ id: MAP.CLUSTER_LAYER, type: 'circle', source: MAP.PIN_SOURCES[0], filter: ['has', 'point_count'], paint: {
    'circle-radius': MAP.PIN_RADIUS, 'circle-color': pinColor(host, '--surface'), 'circle-stroke-color': pinColor(host, '--line'), 'circle-stroke-width': MAP.PIN_BORDER,
  } });
  map.addLayer({ id: `${MAP.CLUSTER_LAYER}-photo`, type: 'symbol', source: MAP.PIN_SOURCES[0], filter: ['has', 'point_count'], layout: {
    'icon-image': ['image', ['get', 'image']], 'icon-allow-overlap': true, 'icon-ignore-placement': false,
  } });
  map.addLayer({ id: `${MAP.CLUSTER_LAYER}-badge`, type: 'circle', source: MAP.PIN_SOURCES[0], filter: ['has', 'point_count'], paint: {
    'circle-radius': MAP.CLUSTER_BADGE_RADIUS, 'circle-translate': [MAP.CLUSTER_BADGE_OFFSET, -MAP.CLUSTER_BADGE_OFFSET], 'circle-color': pinColor(host, '--muted'), 'circle-stroke-color': pinColor(host, '--white'), 'circle-stroke-width': 2,
  } });
  map.addLayer({ id: MAP.CLUSTER_TEXT_LAYER, type: 'symbol', source: MAP.PIN_SOURCES[0], filter: ['has', 'point_count'], layout: {
    'text-field': ['get', 'point_count_abbreviated'], 'text-font': [...MAP.FONT], 'text-size': MAP.CLUSTER_BADGE_TEXT, 'text-allow-overlap': true,
  }, paint: { 'text-color': pinColor(host, '--white'), 'text-translate': [MAP.CLUSTER_BADGE_OFFSET, -MAP.CLUSTER_BADGE_OFFSET] } });
  MAP.PIN_SOURCES.forEach((source, index) => addPinSourceLayers(map, host, source, index));
}
