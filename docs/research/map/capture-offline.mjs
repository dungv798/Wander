import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { restyleMap } from '../../../web/src/shared/map/mapStyle.ts';
import { MAP } from '../../../web/src/shared/map/map.const.ts';

// Chỉ phục vụ bốn tài nguyên MapLibre cục bộ; không proxy và không mở nội dung workspace khác.
const assets = new Set(['maplibre-gl.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl.css']);
const server = createServer(async (req, res) => {
  const name = req.url?.slice(1);
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html data-theme="light"><body></body></html>'); return; }
  if (!assets.has(name)) { res.writeHead(404); res.end(); return; }
  try { res.setHeader('Content-Type', name.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(await readFile(new URL(`../../../web/node_modules/maplibre-gl/dist/${name}`, import.meta.url))); }
  catch { res.writeHead(500); res.end(); }
});
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 780, height: 575 }, deviceScaleFactor: 1 });
  const errors = [], blocked = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    if (route.request().url().startsWith(origin)) return route.continue();
    blocked.push(route.request().url()); return route.abort();
  });
  await page.goto(origin);
  await page.addStyleTag({ content: await readFile(new URL('../../../web/src/styles/tokens.css', import.meta.url), 'utf8') });
  await page.addStyleTag({ content: 'body{margin:0} #map{height:575px} aside{position:absolute;top:12px;left:12px;background:var(--surface);color:var(--ink);padding:12px;font:14px sans-serif;z-index:2}' });
  await page.setContent('<div id="map"></div><aside>HÌNH HỌC GIẢ · Không phải Liberty/tile thật · Chỉ kiểm render</aside>');
  // setContent giữ origin nhưng thay document: nạp lại token/kiểu vừa tạo.
  await page.addStyleTag({ content: await readFile(new URL('../../../web/src/styles/tokens.css', import.meta.url), 'utf8') });
  await page.addStyleTag({ content: 'body{margin:0} #map{height:575px} aside{position:absolute;top:12px;left:12px;background:var(--surface);color:var(--ink);padding:12px;font:14px sans-serif;z-index:2}' });
  const colors = await page.evaluate(({ tokens, tints }) => {
    const css = getComputedStyle(document.documentElement);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const rgb = token => { ctx.fillStyle = css.getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const white = rgb(tokens.halo);
    return Object.fromEntries(Object.entries(tokens).map(([key, token]) => [key, `rgb(${rgb(token).map((value, index) => Math.round(value * (tints[key] ?? 1) + white[index] * (1 - (tints[key] ?? 1)))).join(',')})`]));
  }, { tokens: MAP.BASE_TOKENS, tints: { land: MAP.LAND_TINT, park: MAP.PARK_TINT, casing: MAP.CASING_TINT, boundary: MAP.BOUNDARY_TINT } });
  const polygon = coordinates => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coordinates] } });
  const source = features => ({ type: 'geojson', data: { type: 'FeatureCollection', features } });
  const style = restyleMap({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background' }] }, colors);
  style.layers[0].paint['background-color'] = colors.water;
  style.sources.land = source([polygon([[107.86,11.84],[108.05,11.89],[108.1,11.99],[108.02,12.13],[107.86,12.16],[107.86,11.84]])]);
  style.sources.park = source([polygon([[107.94,11.97],[108.01,11.98],[108.03,12.05],[107.96,12.06],[107.94,11.97]])]);
  style.sources.road = source([{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[107.9,11.87],[108,11.98],[108.03,12.1]] } }]);
  style.layers.push({ id: 'synthetic-land', type: 'fill', source: 'land', paint: { 'fill-color': colors.land } }, { id: 'synthetic-park', type: 'fill', source: 'park', paint: { 'fill-color': colors.park } }, { id: 'synthetic-casing', type: 'line', source: 'road', paint: { 'line-color': colors.casing, 'line-width': 8 } }, { id: 'synthetic-road', type: 'line', source: 'road', paint: { 'line-color': colors.mainRoad, 'line-width': 5 } });
  const rendered = await page.evaluate(async ({ style, origin }) => {
    const ml = await import(`${origin}/maplibre-gl.mjs`);
    ml.setWorkerUrl(`${origin}/maplibre-gl-worker.mjs`);
    const map = new ml.Map({ container: 'map', style, center: [108,12], zoom: 11, attributionControl: false, interactive: false });
    const mapErrors = []; map.on('error', event => mapErrors.push(event.error.message));
    await new Promise((resolve, reject) => { map.once('idle', resolve); setTimeout(() => reject(new Error('Không render idle trong 15 giây')), 15000); });
    return { loaded: map.loaded(), sourceCount: Object.keys(map.getStyle().sources).length, layerCount: map.getStyle().layers.length, mapErrors };
  }, { style, origin });
  await page.screenshot({ path: new URL('offline-minimal.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
  await writeFile(new URL('offline-minimal.style.json', import.meta.url), JSON.stringify(style, null, 2));
  console.log(JSON.stringify({ ...rendered, pageErrors: errors, blockedNetworkRequests: blocked.length, screenshot: 'docs/research/map/offline-minimal.png', warning: 'Hình học giả; không xác nhận Liberty thật, diện mạo hay hiệu năng' }));
  if (!rendered.loaded || rendered.mapErrors.length || errors.length) process.exitCode = 1;
} finally { await browser?.close(); server.close(); }
