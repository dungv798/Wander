import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { seed, mockJourney } from './journey-fixtures.mjs';

import { startCapture } from './chrome-capture.mjs';

const OUT = path.resolve('.logs/ux-video/v2');
const PUBLIC = path.resolve('web/public/video');
const live = process.argv.includes('--live');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(PUBLIC, { recursive: true });
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
const report = { live, viewport: '390x607', deviceScaleFactor: 1.5, steps: [], errors: [] };
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 607 }, deviceScaleFactor: 1.5, locale: 'vi-VN', colorScheme: 'light', reducedMotion: 'no-preference', ...(process.argv.includes('--record-video') ? { recordVideo: { dir: OUT, size: { width: 390, height: 607 } } } : {}) });
  await seed(context);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await mockJourney(page, live);
  const base = server.resolvedUrls.local[0];
  let itinerary;
  // Làm nóng các chunk trước phần quay dùng cho bản phát hành.
  for (const [route, ready] of [['deck/da-lat', '.card.front'], ['export/journey', '.png-export-image'], ['trip/journey/ov', '.tmap[data-ready="1"]']]) {
    await page.goto(`${base}?intro=0&entrance=stagger#/${route}`);
    await page.locator(ready).waitFor();
    if (route.startsWith('export/')) itinerary = await page.locator('.png-export-image').getAttribute('src');
  }
  await page.waitForFunction(() => JSON.parse(document.querySelector('.tmap').dataset.features).length >= 4);
  await page.waitForFunction(() => Number(document.querySelector('.tmap').dataset.renderedImages) >= 5);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  const deckPage = await context.newPage();
  await mockJourney(deckPage, live);
  await deckPage.goto(`${base}?intro=0#/deck/da-lat`);
  await deckPage.locator('.card.front img[data-image-ready="true"]').waitFor();
  await deckPage.evaluate(async () => { await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
  await deckPage.screenshot({ path: path.join(PUBLIC, 'journey-poster.jpg'), type: 'jpeg', quality: 85 });
  await page.bringToFront();
  await page.addStyleTag({ content: `
    #journey-cursor { position:fixed; z-index:99999; width:18px; height:18px; border:2px solid white; border-radius:50%; background:var(--gem); box-shadow:0 1px 8px var(--scrim); pointer-events:none; transform:translate(-50%,-50%); }
    #journey-end { position:fixed; inset:0; z-index:99998; display:grid; place-content:center; gap:16px; text-align:center; background:var(--bg); color:var(--ink); font:800 64px var(--font-display); }
    #journey-end small { font:var(--text-body); }
  ` });
  await page.evaluate(() => { const cursor = document.createElement('div'); cursor.id = 'journey-cursor'; document.body.append(cursor); window.addEventListener('mousemove', e => { cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`; }); });
  // Giữ nhãn tuyến ẩn trong cảnh ghim đầu; bỏ khi chuyển màn.
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'journey-opening';
    style.textContent = '.tm-seg-label { visibility:hidden }';
    document.head.append(style);
  });
  const stopCapture = await startCapture(browser, page);
  // video.currentTime dùng timestamp của recorder để cắt setup bằng trình duyệt, không cần ffmpeg.
  const begin = Date.now();
  report.captureStarted = begin;
  await page.locator('.tmap').evaluate(el => {
    window.entranceSamples = [];
    new MutationObserver(() => window.entranceSamples.push({ at: performance.now(), submittedFeatures: Number(el.dataset.entranceCount) })).observe(el, { attributes: true, attributeFilter: ['data-entrance-count'] });
  });
  const feature = await page.locator('.tmap').evaluate(el => {
    const box = el.getBoundingClientRect();
    const candidates = JSON.parse(el.dataset.features).filter(p => !p.cluster && p.x > 25 && p.x < box.width - 25 && p.y > 65 && p.y < 370);
    return { x: box.x + candidates[0].x, y: box.y + candidates[0].y };
  });
  /** Đưa con trỏ tới mục tiêu với các bước đều, dùng thao tác app thật. */
  async function move(x, y) { await page.mouse.move(x, y, { steps: 20 }); }
  /** Giữ mỗi nhịp đến mốc tính từ lúc bắt đầu quay. */
  async function until(ms) { await page.waitForTimeout(Math.max(0, ms - (Date.now() - begin))); }
  await page.locator('.tmap').evaluate(el => el.dispatchEvent(new Event('wander:pin-entrance')));
  report.steps.push({ at: 0, action: '5 ghim native xuất hiện lần lượt mỗi 240ms' });
  await until(1500); await move(feature.x, feature.y); await page.mouse.click(feature.x, feature.y);
  await page.locator('.tm-preview').waitFor();
  report.steps.push({ at: Date.now() - begin, action: 'Chạm ghim → thẻ xem trước native' });
  await until(3000);
  await stopCapture.selectPage(deckPage);
  const card = await deckPage.locator('.card.front').boundingBox();
  await until(3500);
  await deckPage.mouse.move(card.x + card.width * .3, card.y + card.height * .5);
  await deckPage.mouse.down(); await deckPage.mouse.move(380, card.y + card.height * .45, { steps: 18 }); await deckPage.mouse.up();
  await deckPage.getByRole('button', { name: 'Xem đã chọn (1)', exact: true }).waitFor();
  report.steps.push({ at: Date.now() - begin, action: 'Vuốt phải chọn thẻ thật' });
  await until(4500);
  await stopCapture.selectPage(page);
  await page.evaluate(() => document.querySelector('#journey-opening')?.remove());
  await page.getByRole('tab', { name: 'Ngày 1', exact: true }).click();
  report.steps.push({ at: Date.now() - begin, action: 'Ngày 1: tuyến native vẽ dần từng đoạn trong 850ms' });
  await until(6500);
  // Ảnh xuất thật đã làm nóng; tránh thời gian điều hướng lấn mất cảnh cuối.
  await page.evaluate(src => {
    const end = document.createElement('div'); end.id = 'journey-end';
    const image = document.createElement('img'); image.src = src;
    image.style.cssText = 'width:100vw;height:100vh;object-fit:contain';
    end.append(image); document.body.append(end);
  }, itinerary);
  report.steps.push({ at: Date.now() - begin, action: 'Chia sẻ → ảnh PNG lịch trình thật' });
  await until(7350);
  await page.evaluate(() => { const end = document.querySelector('#journey-end'); const logo = document.createElement('strong'); logo.textContent = 'Wander'; const sub = document.createElement('small'); sub.textContent = 'Chạm một nơi. Mở một hành trình.'; end.replaceChildren(logo, sub); });
  await until(8100);
  report.durationMs = Date.now() - begin;
  report.entranceSamples = await page.evaluate(() => window.entranceSamples);
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
