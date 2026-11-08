import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { serveRepo } from './render.mjs';

/** Render một lần các vật thể 3D (nền trong suốt), tự cắt sát viền, ra PNG cho onboarding: node tools/tvc/render-objects.mjs [plane compass binoculars]. */
/** OUT: thư mục ra; FORMAT: png | webp; MAX: cạnh dài tối đa (px). Mặc định ra PNG 900 px cho bản thử. */
const OUT = path.resolve(process.env.OUT ?? 'web/spike/onboard-story/assets'), FORMAT = process.env.FORMAT ?? 'png', MAX = Number(process.env.MAX ?? 900);
fs.mkdirSync(OUT, { recursive: true });
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['plane', 'compass', 'binoculars'];
const { server, port } = await serveRepo();
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
/** Cắt vùng có ảnh (alpha > 8) cộng đệm 6 px, thu nhỏ tối đa 900 px. */
async function crop(buffer) {
  const mime = FORMAT === 'webp' ? 'image/webp' : 'image/png';
  const page = await browser.newPage();
  const out = await page.evaluate(async ({ b64, mime, max }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    x0 = Math.max(0, x0 - 6); y0 = Math.max(0, y0 - 6); x1 = Math.min(c.width - 1, x1 + 6); y1 = Math.min(c.height - 1, y1 + 6);
    const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.min(1, max / Math.max(w, h)); const o = document.createElement('canvas'); o.width = Math.round(w * k); o.height = Math.round(h * k);
    const og = o.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height); return { data: o.toDataURL(mime, 0.9).split(',')[1], w: o.width, h: o.height };
  }, { b64: buffer.toString('base64'), mime, max: MAX });
  await page.close(); return out;
}
try {
  for (const name of names) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('PAGE ERROR', e.message));
    await page.goto(`http://127.0.0.1:${port}/tools/tvc/objects3d.html?obj=${name}`);
    await page.waitForFunction(() => window.done === true, null, { timeout: 180000 });
    const shot = await page.screenshot({ omitBackground: true });
    const cropped = await crop(shot);
    fs.writeFileSync(path.join(OUT, `${name}.${FORMAT}`), Buffer.from(cropped.data, 'base64'));
    await page.close(); console.log('saved', name, cropped.w + 'x' + cropped.h);
  }
} finally { await browser.close(); server.close(); }
