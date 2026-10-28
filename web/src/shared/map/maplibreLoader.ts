import type * as MapLibreModule from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

/** Mô-đun MapLibre đã tải. */
export type MapLibre = typeof MapLibreModule;

let loading: Promise<MapLibre> | null = null;

/**
 * Tải MapLibre GL một lần cho cả ứng dụng, thành một gói riêng (~281 KB gzip, ADR-015) để gói ban đầu giữ trong ngân sách.
 * Đặt địa chỉ worker (tệp riêng của gói). Lỗi tải không được nhớ, nên lần mở màn sau tự thử lại.
 */
export function loadMapLibre(): Promise<MapLibre> {
  loading ??= (async () => {
    const [ml] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
    ml.setWorkerUrl(workerUrl);
    return ml;
  })();
  loading.catch(() => {
    loading = null;
  });
  return loading;
}
