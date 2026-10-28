import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { MAP } from './map.const.ts';

/** Nhãn ưu tiên tên tiếng Việt, rồi tên chữ Latin, rồi tên gốc (tránh chữ Hán lẫn vào gần biên giới). */
const LABEL_FIELD = ['coalesce', ['get', 'name:vi'], ['get', 'name:latin'], ['get', 'name']];
/** Lớp vector mà bóng núi phải nằm DƯỚI (đường, nhà, ranh giới), để bóng núi không làm mờ chúng. */
const ABOVE_HILLSHADE = new Set(['transportation', 'building', 'boundary', 'aeroway']);
/** Chuỗi có nhắc tới trường "name" thì mới thay (bỏ qua nhãn số hiệu đường, độ cao…). */
const NAME_TOKEN = '"name';

/** Tên lớp nguồn (OpenMapTiles) của một lớp kiểu bản đồ, nếu có. */
function sourceLayerOf(layer: LayerSpecification): string | undefined {
  return (layer as { 'source-layer'?: string })['source-layer'];
}

/** Đổi nhãn chữ sang ưu tiên tên tiếng Việt. */
function withVietnameseLabels(layers: LayerSpecification[]): LayerSpecification[] {
  return layers.map((layer) => {
    if (layer.type !== 'symbol' || !layer.layout?.['text-field'] || !JSON.stringify(layer.layout['text-field']).includes(NAME_TOKEN)) return layer;
    return { ...layer, layout: { ...layer.layout, 'text-field': LABEL_FIELD } } as LayerSpecification;
  });
}

/** Chèn lớp bóng núi ngay dưới đường/nhà/ranh giới đầu tiên (hoặc nhãn đầu tiên nếu không thấy). */
function withHillshade(layers: LayerSpecification[]): LayerSpecification[] {
  const below = layers.findIndex((l) => ABOVE_HILLSHADE.has(sourceLayerOf(l) ?? ''));
  const symbol = layers.findIndex((l) => l.type === 'symbol');
  const at = below >= 0 ? below : symbol >= 0 ? symbol : layers.length;
  const hill: LayerSpecification = {
    id: MAP.HILL_LAYER_ID,
    type: 'hillshade',
    source: MAP.DEM_SOURCE_ID,
    paint: { 'hillshade-shadow-color': MAP.HILL_SHADOW, 'hillshade-highlight-color': MAP.HILL_HIGHLIGHT, 'hillshade-accent-color': MAP.HILL_ACCENT, 'hillshade-exaggeration': MAP.HILL_EXAGGERATION },
  };
  return [...layers.slice(0, at), hill, ...layers.slice(at)];
}

/**
 * Tải kiểu OpenFreeMap rồi chỉnh cho Wander: nhãn tiếng Việt, thêm nguồn độ cao và lớp bóng núi.
 * Lỗi mạng hoặc kiểu không đọc được thì ném lỗi để bản đồ hiện nút "Thử lại".
 */
export async function loadMapStyle(): Promise<StyleSpecification> {
  const res = await fetch(MAP.STYLE_URL);
  if (!res.ok) throw new Error(`style ${res.status}`);
  const style = (await res.json()) as StyleSpecification;
  return {
    ...style,
    sources: { ...style.sources, [MAP.DEM_SOURCE_ID]: { type: 'raster-dem', tiles: [MAP.DEM_TILES], encoding: 'terrarium', tileSize: MAP.DEM_TILE_SIZE, maxzoom: MAP.DEM_MAX_ZOOM, attribution: MAP.DEM_ATTRIBUTION } },
    layers: withHillshade(withVietnameseLabels(style.layers)),
  };
}
