import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { seed, mockJourney } from './journey-fixtures.mjs';

const OUT = '.logs/ux-video';
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
const report = { checks: [], errors: [] };
try {
  await server.listen(); browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  await seed(context);
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  await mockJourney(page);
  await page.goto(`${server.resolvedUrls.local[0]}?intro=0#/`);
  const video = page.locator('.home-hero video');
  await video.waitFor();
  await page.waitForFunction(() => { const v = document.querySelector('.home-hero video'); return v.readyState >= 2 && !v.paused; });
  await video.evaluate(v => { v.pause(); v.currentTime = 4; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/hero-video-390.png` });
  // Đọc toàn bộ frame clip để chọn hai nền cực trị theo độ sáng trung bình.
  const analysis = await video.evaluate(async v => {
    v.pause();
    if (!Number.isFinite(v.duration)) { v.currentTime = 1e10; await new Promise(r => v.addEventListener('seeked', r, { once: true })); }
    const duration = v.duration;
    const canvas = document.createElement('canvas'); canvas.width = 390; canvas.height = 844;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rows = [];
    for (let time = 0; time < Math.min(duration, 9); time += .25) {
      v.currentTime = time; await new Promise(r => v.addEventListener('seeked', r, { once: true }));
      ctx.drawImage(v, 0, 0, 390, 844);
      const pixels = ctx.getImageData(0, 0, 390, 844).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4) sum += .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
      rows.push({ time, brightness: sum / (390 * 844) });
    }
    const sorted = [...rows].sort((a, b) => a.brightness - b.brightness);
    const extremes = [];
    for (const [i, row] of [sorted[0], sorted.at(-1)].entries()) {
      v.currentTime = row.time; await new Promise(r => v.addEventListener('seeked', r, { once: true })); ctx.drawImage(v, 0, 0, 390, 844);
      extremes.push({ ...row, file: `frame-${i}.jpg`, data: canvas.toDataURL('image/jpeg', .92).split(',')[1] });
    }
    return { duration, rows, extremes };
  });
  for (const frame of analysis.extremes) { fs.writeFileSync(`${OUT}/${frame.file}`, Buffer.from(frame.data, 'base64')); delete frame.data; }
  fs.writeFileSync(`${OUT}/frames.json`, JSON.stringify(analysis, null, 2));
  const play = page.getByRole('button', { name: 'Phát video nền', exact: true });
  await play.click();
  await page.waitForFunction(() => !document.querySelector('.home-hero video').paused);
  await page.getByRole('button', { name: 'Tạm dừng video nền', exact: true }).click();
  assert.equal(await video.evaluate(v => v.paused), true);
  report.checks.push('Pause: video.paused=true; play hoạt động');
  const other = await context.newPage(); await other.bringToFront();
  // Headless có thể không mô phỏng tab ẩn; phát sự kiện với trạng thái hidden để kiểm handler.
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await video.evaluate(v => v.paused), true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await video.evaluate(v => v.paused), true);
  report.checks.push('Visibility handler giữ lựa chọn dừng của người xem');
  await other.close(); await page.bringToFront();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await video.waitFor({ state: 'detached' });
  await page.screenshot({ path: `${OUT}/hero-static-390.png` });
  report.checks.push('Reduced-motion đổi trực tiếp: tháo video, giữ ảnh');
  const saved = await browser.newContext({ viewport: { width: 390, height: 844 } }); await seed(saved);
  await saved.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, addEventListener() {}, removeEventListener() {} } }));
  const savePage = await saved.newPage(); await mockJourney(savePage);
  await savePage.goto(`${server.resolvedUrls.local[0]}?intro=0#/`); await savePage.locator('.home-hero h1').waitFor(); await savePage.waitForTimeout(500);
  assert.equal(await savePage.locator('.home-hero video').count(), 0);
  report.checks.push('SaveData=true: không gắn video');
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.setViewportSize({ width: 320, height: 844 }); await page.waitForTimeout(500);
  assert.equal(await video.count(), 0);
  report.checks.push('320px: giữ ảnh');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally { fs.writeFileSync(`${OUT}/capture-hero.json`, JSON.stringify(report, null, 2)); await browser?.close(); await server.close(); }
