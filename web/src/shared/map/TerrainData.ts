import { ApiError } from '../api/ApiError.ts';
import { MAP } from './map.const.ts';
import type { MapData, MapMeta, MapVectors, Pt } from './map.types.ts';

const TILE_SIZE = 256;
const HALF_TURN_DEG = 180;
const FULL_TURN_DEG = 360;
const HALF = 2;

/** Tải và nhớ dữ liệu bản đồ của điểm đến (meta + vector); chiếu tọa độ địa lý sang điểm ảnh của ảnh nền. */
export class TerrainData {
  private static readonly cache = new Map<string, Promise<MapData>>();

  /** Tải (một lần cho mỗi điểm đến); lỗi không được nhớ nên lần sau thử lại được. */
  static load(dest: string): Promise<MapData> {
    const hit = TerrainData.cache.get(dest);
    if (hit) return hit;
    const base = `${MAP.DATA_PATH}${dest}/`;
    const get = <T>(file: string): Promise<T> =>
      fetch(base + file).then((r) => {
        if (!r.ok) throw new ApiError('MAP_DATA', r.status);
        return r.json() as Promise<T>;
      });
    const p = Promise.all([get<MapMeta>('meta.json'), get<MapVectors>('vectors.json')]).then(([meta, vectors]) => ({ dest, base, meta, vectors }));
    TerrainData.cache.set(dest, p);
    p.catch(() => TerrainData.cache.delete(dest));
    return p;
  }

  /** Chiếu (vĩ độ, kinh độ) sang tọa độ điểm ảnh của ảnh nền (Web Mercator, cùng cách với build-map.mjs). */
  static project(meta: MapMeta, lat: number, lon: number): Pt {
    const n = HALF ** meta.zoom;
    const r = (lat * Math.PI) / HALF_TURN_DEG;
    const x = ((lon + HALF_TURN_DEG) / FULL_TURN_DEG) * n * TILE_SIZE - meta.origin[0];
    const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / HALF) * n * TILE_SIZE - meta.origin[1];
    return [x, y];
  }
}
