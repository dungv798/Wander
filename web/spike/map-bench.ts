// Bộ đo tạm (spike, không đưa vào ứng dụng): thời gian khung hình khi zoom bằng chuột trên hai bản đồ.
//   ?m=terrain  → bản đồ địa hình tự dựng hiện tại (TerrainMap)
//   ?m=gl       → MapLibre GL + OpenFreeMap (nền vector) + hillshade ô độ cao AWS
import { Map as GlMap, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../src/app/styles.css';
import { GeoMap } from '../src/shared/map/GeoMap.ts';
import { TerrainMap } from '../src/shared/map/TerrainMap.ts';

const WHEEL_EVENTS = 60;
const WHEEL_GAP_MS = 33;
const SETTLE_MS = 400;
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const HA_GIANG = { lat: 23.0, lon: 105.0 };

const host = document.getElementById('host') as HTMLElement;
const kind = new URLSearchParams(location.search).get('m') ?? 'terrain';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Dựng bản đồ tự dựng với vài ghim ở Hà Giang. */
function startTerrain(): void {
  const m = new TerrainMap(host, { dest: 'ha-giang', label: 'bench', interactive: true, towns: true, credit: false });
  m.setMarkers([
    { id: 'a', lat: 23.28, lon: 105.36, label: 'Đồng Văn' },
    { id: 'b', lat: 23.37, lon: 105.32, label: 'Lũng Cú' },
    { id: 'c', lat: 22.82, lon: 104.98, label: 'Hà Giang' },
  ]);
}

/** Dựng MapLibre với nền OpenFreeMap và lớp bóng núi từ ô độ cao AWS. */
function startGl(): GlMap {
  setWorkerUrl(workerUrl);
  const map = new GlMap({ container: host, style: STYLE_URL, center: [HA_GIANG.lon, HA_GIANG.lat], zoom: 8, attributionControl: false });
  map.on('load', () => {
    map.addSource('dem', { type: 'raster-dem', tiles: [DEM_TILES], encoding: 'terrarium', tileSize: 256, maxzoom: 12 });
    map.addLayer({ id: 'hill', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': 0.5 } });
  });
  return map;
}

/** Thống kê khoảng cách giữa các khung hình (ms). */
function stats(frames: number[]): Record<string, number> {
  const sorted = [...frames].sort((a, b) => a - b);
  const at = (q: number): number => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return { frames: frames.length, p50: at(0.5), p95: at(0.95), max: sorted[sorted.length - 1] ?? 0, over33: frames.filter((f) => f > 33).length, over100: frames.filter((f) => f > 100).length };
}

/** Lăn chuột phóng 30 nấc rồi thu 30 nấc, ghi khoảng cách khung hình suốt quá trình. */
async function bench(): Promise<Record<string, number>> {
  const frames: number[] = [];
  let last = performance.now();
  let running = true;
  const tick = (t: number): void => {
    frames.push(t - last);
    last = t;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const r = host.getBoundingClientRect();
  const [cx, cy] = [r.left + r.width / 2, r.top + r.height / 2];
  for (let i = 0; i < WHEEL_EVENTS; i += 1) {
    const target = (host.querySelector('canvas') ?? host) as HTMLElement;
    target.dispatchEvent(new WheelEvent('wheel', { deltaY: i < WHEEL_EVENTS / 2 ? -160 : 160, clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
    await sleep(WHEEL_GAP_MS);
  }
  await sleep(SETTLE_MS);
  running = false;
  return stats(frames.slice(1));
}

/** Dựng GeoMap (bản đồ thật của ứng dụng) với bốn ghim ở Đà Lạt; mode=route thì có tuyến và số, ngược lại gộp cụm. */
function startGeo(): void {
  const mode = new URLSearchParams(location.search).get('mode') === 'route' ? 'route' : 'browse';
  const m = new GeoMap(host, { dest: 'da-lat', label: 'bench', interactive: true, towns: false, credit: true, onPin: () => undefined });
  const num = (n: number): { num?: number } => (mode === 'route' ? { num: n } : {});
  m.setMarkers([
    { id: 'a', lat: 11.9437, lon: 108.4457, label: 'Hồ Xuân Hương', ...num(1) },
    { id: 'b', lat: 11.976, lon: 108.4503, label: 'Thung lũng Tình Yêu', ...num(2) },
    { id: 'c', lat: 11.9005, lon: 108.4487, label: 'Thác Datanla', ...num(3) },
    { id: 'd', lat: 11.9421, lon: 108.4412, label: 'Chợ Đà Lạt', ...num(4) },
  ]);
  m.setMode(mode);
  if (mode === 'route') m.setRoute(['a', 'b', 'c'], ['4 km', '9 km']);
  m.fitTo(null, { animate: false });
  const timer = setInterval(() => {
    if (host.dataset['ready'] === '1') {
      clearInterval(timer);
      setTimeout(() => {
        (window as unknown as { __ready: boolean }).__ready = true;
      }, 2500);
    }
  }, 200);
}

const w = window as unknown as { __bench: () => Promise<Record<string, number>>; __ready: boolean };
w.__bench = bench;
if (kind === 'geo') {
  startGeo();
} else if (kind === 'gl') {
  const map = startGl();
  map.on('idle', () => {
    w.__ready = true;
  });
} else {
  startTerrain();
  setTimeout(() => {
    w.__ready = true;
  }, 3000);
}
