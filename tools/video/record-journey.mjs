import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { seed, mockJourney } from './journey-fixtures.mjs';

import { startCapture } from './chrome-capture.mjs';

const OUT = path.resolve('.logs/ux-video');
const PUBLIC = path.resolve('web/public/video');
const live = process.argv.includes('--live');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(PUBLIC, { recursive: true });
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
const report = { live, viewport: '390x844', deviceScaleFactor: 1.5, steps: [], errors: [] };
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, locale: 'vi-VN', colorScheme: 'light', reducedMotion: 'no-preference', ...(process.argv.includes('--record-video') ? { recordVideo: { dir: OUT, size: { width: 390, height: 844 } } } : {}) });
  await seed(context);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await mockJourney(page, live);
  const base = server.resolvedUrls.local[0];
  // Làm nóng các chunk trước phần quay dùng cho bản phát hành.
  for (const [route, ready] of [['deck/da-lat', '.card.front'], ['export/journey', '.png-export-image'], ['trip/journey/ov', '.tmap[data-ready="1"]']]) {
    await page.goto(`${base}?intro=0#/${route}`);
    await page.locator(ready).waitFor();
  }
  await page.waitForFunction(() => JSON.parse(document.querySelector('.tmap').dataset.features).length >= 4);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  await page.addStyleTag({ content: `
    #journey-cursor { position:fixed; z-index:99999; width:18px; height:18px; border:2px solid white; border-radius:50%; background:var(--gem); box-shadow:0 1px 8px var(--scrim); pointer-events:none; transform:translate(-50%,-50%); }
    #journey-end { position:fixed; inset:0; z-index:99998; display:grid; place-content:center; gap:16px; text-align:center; background:var(--bg); color:var(--ink); font:800 64px var(--font-display); }
    #journey-end small { font:var(--text-body); }
  ` });
  await page.evaluate(() => { const cursor = document.createElement('div'); cursor.id = 'journey-cursor'; document.body.append(cursor); window.addEventListener('mousemove', e => { cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`; }); });
  const stopCapture = await startCapture(browser, page);
  // video.currentTime dùng timestamp của recorder để cắt setup bằng trình duyệt, không cần ffmpeg.
  const begin = Date.now();
  report.captureStarted = begin;
  const feature = await page.locator('.tmap').evaluate(el => {
    const box = el.getBoundingClientRect();
    const candidates = JSON.parse(el.dataset.features).filter(p => !p.cluster && p.x > 25 && p.x < box.width - 25 && p.y > 65 && p.y < 370);
    return { x: box.x + candidates[0].x, y: box.y + candidates[0].y };
  });
  /** Đưa con trỏ tới mục tiêu với các bước đều, dùng thao tác app thật. */
  async function move(x, y) { await page.mouse.move(x, y, { steps: 20 }); }
  /** Giữ mỗi nhịp đến mốc tính từ lúc bắt đầu quay. */
  async function until(ms) { await page.waitForTimeout(Math.max(0, ms - (Date.now() - begin))); }
  report.steps.push({ at: 0, action: 'Bản đồ phẳng và ghim ảnh thật của chuyến' });
  await until(1250); await move(feature.x, feature.y); await page.mouse.click(feature.x, feature.y);
  await page.locator('.tm-preview').waitFor();
  report.steps.push({ at: Date.now() - begin, action: 'Chạm ghim → thẻ xem trước native' });
  await until(2800);
  await page.evaluate(() => { location.hash = '#/deck/da-lat'; });
  await page.locator('.card.front').waitFor();
  await page.screenshot({ path: path.join(PUBLIC, 'journey-poster.jpg'), type: 'jpeg', quality: 85 });
  const card = await page.locator('.card.front').boundingBox();
  await move(card.x + card.width * .3, card.y + card.height * .5);
  await page.mouse.down(); await page.mouse.move(380, card.y + card.height * .45, { steps: 25 }); await page.mouse.up();
  report.steps.push({ at: Date.now() - begin, action: 'Vuốt phải chọn thẻ thật' });
  await until(4400);
  await page.evaluate(() => { location.hash = '#/trip/journey/ov'; });
  await page.locator('.tmap[data-ready="1"]').waitFor();
  // Tạm giữ tuyến tĩnh: NativeRoute.animate ngoài phạm vi có lỗi timestamp rAF âm trên Chrome.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('tab', { name: 'Ngày 1', exact: true }).click();
  report.steps.push({ at: Date.now() - begin, action: 'Ngày 1, tuyến tĩnh; vẽ dần bị chặn bởi lỗi NativeRoute' });
  await until(6400);
  await page.getByRole('button', { name: 'Lưu hoặc gửi lịch trình', exact: true }).click();
  await page.locator('.png-export-image').waitFor();
  report.steps.push({ at: Date.now() - begin, action: 'Chia sẻ → ảnh PNG lịch trình thật' });
  await until(7450);
  await page.evaluate(() => { const end = document.createElement('div'); end.id = 'journey-end'; const logo = document.createElement('strong'); logo.textContent = 'Wander'; const sub = document.createElement('small'); sub.textContent = 'Chạm một nơi. Mở một hành trình.'; end.append(logo, sub); document.body.append(end); });
  await until(8250);
  report.durationMs = Date.now() - begin;
  report.video = await stopCapture(path.join(PUBLIC, 'journey.webm'));
  const raw = page.video();

  await context.close();
  if (raw) report.raw = await raw.path();
  report.recorded = true;
  fs.writeFileSync(path.join(OUT, 'record.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close(); await server.close();
  fs.writeFileSync(path.join(OUT, 'record.json'), JSON.stringify(report, null, 2));
}
