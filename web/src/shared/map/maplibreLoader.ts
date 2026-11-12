import type * as MapLibreModule from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

/** The MapLibre module that has been loaded. */
export type MapLibre = typeof MapLibreModule;

let loading: Promise<MapLibre> | null = null;

/**
 * Loads MapLibre GL once for the whole app, as its own bundle (about 281 KB gzip, ADR-015) so the initial bundle stays within the budget.
 * Sets the worker address (a separate file of the bundle). A load error is not remembered, so the next time the screen opens it retries by itself.
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
