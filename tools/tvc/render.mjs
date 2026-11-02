import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';

/**
 * Dựng TVC Wander từ `composition.html` bằng cách bước thời gian xác định (không quay thời gian thực), nên không giật và không mờ.
 *   node tools/tvc/render.mjs preview 0.8,3,6.5     → ảnh xem thử ở tools/tvc/out/preview-*.png
 *   node tools/tvc/render.mjs frames                → toàn bộ khung hình PNG 1080×1920 ở tools/tvc/out/frames
 * Mã hóa video: `node tools/tvc/encode.mjs` (mã hóa trong Chrome, không cần ffmpeg).
 */
const ROOT = path.resolve('.');
const OUT = path.resolve('tools/tvc/out');
const FPS = 30;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

/** Máy chủ tĩnh chỉ phục vụ thư mục repo (để font và ảnh tải được qua http, tránh chặn file://). */
export function serveRepo() {
  const server = http.createServer((req, res) => {
    const file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const mode = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await serveRepo();
  const COMP = process.env.COMP ?? 'composition.html';
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('PAGE ERROR', e.message));
    page.on('requestfailed', r => console.error('REQUEST FAILED', r.url()));
    await page.goto(`http://127.0.0.1:${port}/tools/tvc/${COMP}`);
    await page.waitForFunction(() => window.ready !== undefined, null, { timeout: 120000 });
    await page.evaluate(() => window.ready);
    const duration = await page.evaluate(() => window.DURATION);
    if (mode === 'preview') {
      for (const t of (process.argv[3] ?? '1').split(',').map(Number)) {
        await page.evaluate(time => window.render(time), t);
        await page.screenshot({ path: path.join(OUT, `preview-${String(t).replace('.', '_')}.png`) });
      }
    } else if (mode === 'frames') {
      const dir = path.join(OUT, 'frames');
      fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      const total = Math.round(duration * FPS);
      for (let i = 0; i < total; i++) {
        await page.evaluate(time => window.render(time), i / FPS);
        await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.png`), type: 'png' });
        if (i % 60 === 0) console.log(`frame ${i}/${total}`);
      }
      fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ fps: FPS, total, duration }));
      console.log('done', total, 'frames');
    } else {
      console.error('usage: preview <t1,t2,...> | frames');
    }
  } finally {
    await browser.close(); server.close();
  }
}
