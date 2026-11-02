import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { serveRepo } from './render.mjs';

/**
 * Mã hóa các khung hình PNG đã dựng thành WebM bằng chính Chrome (không cần ffmpeg): khung hình được nạp trước, vẽ lên canvas
 * theo nhịp 30 fps và đẩy từng khung vào MediaRecorder. Chạy sau `render.mjs frames`.
 *   node tools/tvc/encode.mjs master   → out/wander-tvc.webm   (1080×1920, ~10 Mbps, bản gốc để chia sẻ)
 *   node tools/tvc/encode.mjs hero     → out/wander-hero.webm  (720×1120, tỉ lệ 9:14 như khung hero, nhẹ)
 */
const OUT = path.resolve('tools/tvc/out');
const PROFILES = {
  master: { file: 'wander-tvc.webm', w: 1080, h: 1920, crop: [0, 0, 1080, 1920], bitrate: 10_000_000, mime: 'video/webm;codecs=vp9' },
  hero: { file: 'wander-hero.webm', w: 720, h: 1120, crop: [0, 120, 1080, 1680], bitrate: Number(process.env.HERO_BITRATE ?? 900_000), mime: 'video/webm;codecs=vp9' },
};
const profile = PROFILES[process.argv[2]];
if (!profile) { console.error('usage: master | hero'); process.exit(1); }
const meta = JSON.parse(fs.readFileSync(path.join(OUT, 'frames.json'), 'utf8'));

/** Máy chủ nhận tệp video từ trang mã hóa (tránh đẩy hàng chục MB qua giao thức điều khiển). */
function receiver() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => { fs.writeFileSync(path.join(OUT, profile.file), Buffer.concat(chunks)); res.end('ok'); });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

const { server, port } = await serveRepo();
const rx = await receiver();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  await page.goto(`http://127.0.0.1:${port}/tools/tvc/encoder.html`);
  const result = await page.evaluate(async args => window.encodeFrames(args), { ...profile, ...meta, base: '/tools/tvc/out/frames/', uploadUrl: `http://127.0.0.1:${rx.port}/`, ahead: 10 });
  console.log(JSON.stringify({ ...result, file: path.join(OUT, profile.file), bytes: fs.statSync(path.join(OUT, profile.file)).size }));
} finally {
  await browser.close(); server.close(); rx.server.close();
}
