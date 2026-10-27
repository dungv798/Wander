// Dựng "bản đồ địa hình riêng của Wander" cho một điểm đến, chạy MỘT LẦN khi chuẩn bị dữ liệu (không chạy ở thiết bị người dùng).
//   node docs/ux/tools/build-map.mjs --dest=ha-giang [--skip-osm] [--skip-render]
// Nguồn dữ liệu (đều miễn phí, cần ghi công trên bản đồ):
//   - Độ cao: AWS Terrain Tiles (định dạng Terrarium, gốc SRTM/…); zoom 12 (~35 m/điểm ảnh).
//   - Đường chính, sông, thị trấn: OpenStreetMap qua Overpass API (ODbL).
// Đầu ra trong docs/ux/prototype/map/<dest>/:
//   shade.webp   hillshade xám (ánh sáng đa hướng) zoom 12: lớp "khối núi", nhân (multiply) lên màu đất của token
//   height.webp  độ cao chuẩn hóa xám, thu nhỏ: ánh xạ sang dải màu trong SVG (màu lấy từ token, nên đổi bộ màu không phải dựng lại)
//   vectors.json đường/sông/thị trấn đã chiếu sang không gian điểm ảnh zoom 12 và đơn giản hóa
// Bộ nhớ đệm: .tmp/map/<dest>/ (đã nằm trong .gitignore).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const flag = (k) => process.argv.includes(`--${k}`);
const DEST = arg('dest', 'ha-giang');

/** Cấu hình từng điểm đến: khung bao [tây, nam, đông, bắc] theo độ, zoom của lớp độ cao. */
const CONFIG = {
  'ha-giang': { bbox: [104.6, 22.55, 105.6, 23.45], zoom: 12, townNames: ['Đồng Văn', 'Mèo Vạc', 'Yên Minh', 'Quản Bạ', 'Hoàng Su Phì', 'Vị Xuyên', 'Bắc Mê', 'Hà Giang', 'Lũng Cú'] }
};
const cfg = CONFIG[DEST];
if (!cfg) throw new Error('Chưa có cấu hình cho điểm đến ' + DEST);
const [W, S, E, N] = cfg.bbox, Z = cfg.zoom;
const CACHE = path.join(ROOT, '.tmp/map', DEST);
const OUT = path.join(ROOT, 'docs/ux/prototype/map', DEST);
fs.mkdirSync(path.join(CACHE, 'tiles'), { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const UA = 'WanderPrototype/0.1 (ui design research; contact binkuteqn289@gmail.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Kinh độ → toạ độ ô (số thực) ở zoom Z. */
const lonToX = (lon, z = Z) => ((lon + 180) / 360) * 2 ** z;
/** Vĩ độ → toạ độ ô (số thực) ở zoom Z (Web Mercator). */
const latToY = (lat, z = Z) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z; };
const X0 = Math.floor(lonToX(W)), X1 = Math.floor(lonToX(E));
const Y0 = Math.floor(latToY(N)), Y1 = Math.floor(latToY(S));

/** Tải một ô độ cao (có đệm); thử lại khi lỗi mạng. */
async function tile(x, y) {
  const f = path.join(CACHE, 'tiles', `${Z}-${x}-${y}.png`);
  if (fs.existsSync(f)) return;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`, { headers: { 'User-Agent': UA } });
      if (r.ok) { fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return; }
    } catch { /* thử lại */ }
    await sleep(1500 * (i + 1));
  }
  throw new Error(`Không tải được ô ${x},${y}`);
}

/** Gọi Overpass với nhiều máy chủ và lùi dần (máy chủ công cộng hay quá tải). */
async function overpass(name, query) {
  const f = path.join(CACHE, name + '.json');
  if (fs.existsSync(f) && fs.statSync(f).size > 800) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const eps = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  for (let i = 0; i < 14; i++) {
    const ep = eps[i % eps.length];
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(query) });
      const t = await r.text();
      if (r.ok && t.trim().startsWith('{')) { fs.writeFileSync(f, t); console.log(`  ${name}: ${(t.length / 1e6).toFixed(1)} MB (${ep})`); return JSON.parse(t); }
    } catch { /* thử máy khác */ }
    console.log(`  ${name}: máy chủ bận, chờ rồi thử lại (${i + 1}/14)`);
    await sleep(Math.min(60000, 8000 * (1 + i)));
  }
  throw new Error('Overpass không trả lời cho ' + name);
}

const bb = `${S},${W},${N},${E}`;
if (!flag('skip-render')) {
  console.log(`Ô độ cao zoom ${Z}: x ${X0}…${X1}, y ${Y0}…${Y1} (${(X1 - X0 + 1) * (Y1 - Y0 + 1)} ô)`);
  const jobs = [];
  for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) jobs.push([x, y]);
  for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map(([x, y]) => tile(x, y)));
}

let osm = null;
if (!flag('skip-osm')) {
  console.log('OpenStreetMap (Overpass)…');
  const roads = await overpass('roads', `[out:json][timeout:90];(way["highway"~"^(trunk|primary|secondary)$"](${bb}););out geom;`);
  await sleep(4000);
  const water = await overpass('water', `[out:json][timeout:90];(way["waterway"="river"](${bb});way["natural"="water"]["name"](${bb}););out geom;`);
  await sleep(4000);
  const places = await overpass('places', `[out:json][timeout:60];(node["place"~"^(city|town)$"](${bb});node["place"~"^(village|hamlet)$"]["name"~"${cfg.townNames.join('|')}"](${bb}););out;`);
  osm = { roads, water, places };
}

/** Đơn giản hóa đường gấp khúc (Douglas–Peucker) với dung sai tính bằng điểm ảnh zoom Z. */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let dmax = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len; if (d > dmax) { dmax = d; idx = i; } }
    if (dmax > eps && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const ox = X0 * 256, oy = Y0 * 256, width = (X1 - X0 + 1) * 256, height = (Y1 - Y0 + 1) * 256;
/** Chiếu (vĩ, kinh) sang điểm ảnh trong mosaic zoom Z. */
const proj = (lat, lon) => [Math.round((lonToX(lon) * 256 - ox) * 10) / 10, Math.round((latToY(lat) * 256 - oy) * 10) / 10];
if (osm) {
  const line = (w) => rdp(w.geometry.map((g) => proj(g.lat, g.lon)), 1.4);
  const flat = (a) => a.flat().join(',');
  const vec = {
    dest: DEST, zoom: Z, width, height, origin: [ox, oy], bbox: cfg.bbox,
    roads: osm.roads.elements.filter((e) => e.geometry).map((e) => ({ k: e.tags.highway, n: e.tags.ref || e.tags.name || '', p: line(e) })).filter((r) => r.p.length > 1),
    rivers: osm.water.elements.filter((e) => e.geometry && e.tags.waterway).map((e) => ({ n: e.tags.name || '', p: line(e) })).filter((r) => r.p.length > 1),
    lakes: osm.water.elements.filter((e) => e.geometry && e.tags.natural === 'water').map((e) => ({ n: e.tags.name || '', p: line(e) })).filter((r) => r.p.length > 3),
    places: osm.places.elements.map((e) => ({ n: e.tags.name, k: e.tags.place, p: proj(e.lat, e.lon) })).filter((p) => p.n && !/[㐀-鿿]/.test(p.n) && cfg.townNames.some((t) => p.n.includes(t)))
  };
  void flat;
  fs.writeFileSync(path.join(OUT, 'vectors.json'), JSON.stringify(vec));
  console.log(`vectors.json: ${vec.roads.length} đường, ${vec.rivers.length} sông, ${vec.lakes.length} hồ, ${vec.places.length} địa danh`);
}

if (!flag('skip-render')) {
  // Trang dựng ảnh chạy trong Chrome không đầu: giải mã PNG Terrarium bằng canvas, tính hillshade và độ cao chuẩn hóa.
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><meta charset=utf-8><body>'); return; }
    const f = path.join(CACHE, u);
    if (!f.startsWith(CACHE) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' }); fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
  const page = await browser.newPage();
  await page.goto(base + '/');
  const out = await page.evaluate(async ({ base, X0, X1, Y0, Y1, Z, width, height }) => {
    // 1) mosaic độ cao (mét) từ các ô Terrarium
    const elev = new Float32Array(width * height);
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d', { willReadFrequently: true });
    for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) {
      const bmp = await createImageBitmap(await (await fetch(`${base}/tiles/${Z}-${x}-${y}.png`)).blob(), { colorSpaceConversion: 'none' });
      g.clearRect(0, 0, 256, 256); g.drawImage(bmp, 0, 0); const d = g.getImageData(0, 0, 256, 256).data;
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4; elev[((y - Y0) * 256 + j) * width + (x - X0) * 256 + i] = d[k] * 256 + d[k + 1] + d[k + 2] / 256 - 32768; }
    }
    // 2) hillshade đa hướng (Horn), cỡ ô theo vĩ độ từng hàng, phóng đại đứng để khối núi rõ
    /** Hệ số mờ dần về mép ảnh (0 ở mép, 1 từ cách mép `f` điểm ảnh): bản đồ tan vào nền, không có đường cắt cứng. */
    const edge = (i, j, w, h, f) => { const d = Math.min(i, j, w - 1 - i, h - 1 - j) / f; const t = Math.max(0, Math.min(1, d)); return t * t * (3 - 2 * t); };
    const R = 6378137, Zf = 1.9;
    const shade = new Uint8ClampedArray(width * height * 4);
    const az = [315, 20, 250].map((a) => ((360 - a + 90) % 360) * Math.PI / 180), wgt = [0.6, 0.2, 0.2], zen = (90 - 42) * Math.PI / 180;
    for (let j = 1; j < height - 1; j++) {
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * ((Y0 * 256 + j) / (256 * 2 ** Z))))), cell = (2 * Math.PI * R * Math.cos(lat)) / (256 * 2 ** Z);
      for (let i = 1; i < width - 1; i++) {
        const o = j * width + i, a = elev[o - width - 1], b = elev[o - width], cc = elev[o - width + 1], d = elev[o - 1], f = elev[o + 1], gg = elev[o + width - 1], h = elev[o + width], ii = elev[o + width + 1];
        const dzdx = ((cc + 2 * f + ii) - (a + 2 * d + gg)) / (8 * cell), dzdy = ((gg + 2 * h + ii) - (a + 2 * b + cc)) / (8 * cell);
        const slope = Math.atan(Zf * Math.hypot(dzdx, dzdy)), asp = Math.atan2(dzdy, -dzdx);
        let s = 0; for (let m = 0; m < 3; m++) s += wgt[m] * Math.max(0, Math.cos(zen) * Math.cos(slope) + Math.sin(zen) * Math.sin(slope) * Math.cos(az[m] - asp));
        const v = Math.round(255 * Math.min(1, Math.pow(s, 0.9) * 1.12)), k = o * 4; shade[k] = shade[k + 1] = shade[k + 2] = v; shade[k + 3] = Math.round(255 * edge(i, j, width, height, 220));
      }
    }
    const cv = document.createElement('canvas'); cv.width = width; cv.height = height; cv.getContext('2d').putImageData(new ImageData(shade, width, height), 0, 0);
    const shadeUrl = cv.toDataURL('image/webp', 0.66);
    // 3) độ cao chuẩn hóa (cắt 2%–98%), thu nhỏ 1/4, làm mượt nhẹ
    const sorted = Float32Array.from(elev).sort(); const lo = sorted[Math.floor(sorted.length * 0.02)], hi = sorted[Math.floor(sorted.length * 0.98)];
    const sw = Math.round(width / 4), sh = Math.round(height / 4), hv = new Uint8ClampedArray(sw * sh * 4);
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
      let s = 0, n = 0; for (let dj = 0; dj < 4; dj++) for (let di = 0; di < 4; di++) { s += elev[(j * 4 + dj) * width + i * 4 + di]; n++; }
      const v = Math.round(255 * Math.max(0, Math.min(1, (s / n - lo) / (hi - lo)))), k = (j * sw + i) * 4; hv[k] = hv[k + 1] = hv[k + 2] = v; hv[k + 3] = Math.round(255 * edge(i, j, sw, sh, 55));
    }
    const cs = document.createElement('canvas'); cs.width = sw; cs.height = sh; cs.getContext('2d').putImageData(new ImageData(hv, sw, sh), 0, 0);
    return { shadeUrl, heightUrl: cs.toDataURL('image/webp', 0.9), lo, hi, sw, sh };
  }, { base, X0, X1, Y0, Y1, Z, width, height });
  const save = (u, f) => fs.writeFileSync(path.join(OUT, f), Buffer.from(u.split(',')[1], 'base64'));
  save(out.shadeUrl, 'shade.webp'); save(out.heightUrl, 'height.webp');
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ dest: DEST, zoom: Z, width, height, origin: [ox, oy], bbox: cfg.bbox, elevationRangeM: [Math.round(out.lo), Math.round(out.hi)], heightSize: [out.sw, out.sh], credit: 'Độ cao: AWS Terrain Tiles (SRTM và nguồn khác). Đường, sông: © OpenStreetMap contributors (ODbL).' }, null, 1));
  console.log(`shade.webp ${(fs.statSync(path.join(OUT, 'shade.webp')).size / 1e3).toFixed(0)} KB, height.webp ${(fs.statSync(path.join(OUT, 'height.webp')).size / 1e3).toFixed(0)} KB; độ cao ${Math.round(out.lo)}–${Math.round(out.hi)} m`);
  await browser.close(); server.close();
}
console.log('Xong:', OUT);
