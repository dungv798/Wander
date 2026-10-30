import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { seed, mockJourney } from './journey-fixtures.mjs';
import { measureHeroContrast } from './measure-hero-contrast.mjs';

const OUT = '.logs/ux-video/v2';
fs.mkdirSync(OUT, { recursive: true });
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
const report = { checks: [], frames: [], errors: [] };
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  await seed(context);
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  await mockJourney(page);
  const url = `${server.resolvedUrls.local[0]}?intro=0&hero=video#/`;
  await page.goto(url);
  await page.locator('.home-hero h1').waitFor();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('video').count(), 0);
  report.checks.push('No video before interaction');
  await page.keyboard.press('Shift');
  const video = page.locator('.home-hero video');
  await page.waitForTimeout(1200);
  await video.waitFor();
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2 && !document.querySelector('video').paused);
  // Chỉ xuất ba ảnh hero; không đọc thêm frame ngoài ngân sách xem ảnh.
  for (const [name, time] of [['start', .6], ['middle', 3.4], ['end', 7.65]]) {
    await video.evaluate(async (v, t) => {
      v.pause();
      await new Promise(resolve => { v.addEventListener('seeked', resolve, { once: true }); v.currentTime = t; });
    }, time);
    await page.screenshot({ path: `${OUT}/hero-video-${name}-390.png` });
    report.frames.push({ name, time });
  }
  const geometry = await page.evaluate(() => {
    const v = document.querySelector('video').getBoundingClientRect();
    const content = document.querySelector('.home-hero-content').getBoundingClientRect();
    const search = document.querySelector('.home-hero .search').getBoundingClientRect();
    return { videoBottom: v.bottom, contentTop: content.top, searchTop: search.top, height: document.querySelector('.home-hero').clientHeight, pageHeight: document.querySelector('#screen').scrollHeight, scrollWidth: document.documentElement.scrollWidth };
  });
  assert.ok(geometry.contentTop >= geometry.videoBottom);
  assert.ok(geometry.searchTop >= geometry.videoBottom);
  assert.equal(geometry.scrollWidth, 390);
  report.geometry = geometry;
  report.checks.push('Video and text/search do not overlap; no horizontal overflow');
  report.contrast = await measureHeroContrast(page);
  assert.ok(report.contrast.every(row => row.minimum >= 4.5), 'mọi chữ hero video đạt 4.5:1');
  await page.getByRole('button', { name: 'Phát video nền', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('video').paused);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await video.evaluate(v => v.paused), true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => !document.querySelector('video').paused);
  await page.getByRole('button', { name: 'Tạm dừng video nền', exact: true }).click();
  assert.equal(await video.evaluate(v => v.paused), true);
  report.checks.push('Pause/play accessible; hidden tab pauses and visible tab resumes');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await video.waitFor({ state: 'detached' });
  await page.screenshot({ path: `${OUT}/hero-static-390.png` });
  report.checks.push('Reduced motion removes video and restores image hero');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.waitForTimeout(300);
  assert.equal(await video.count(), 0);
  report.checks.push('320px uses image');
  const saved = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seed(saved);
  await saved.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, addEventListener() {}, removeEventListener() {} } }));
  const savePage = await saved.newPage(); await mockJourney(savePage);
  await savePage.goto(url); await savePage.locator('.home-hero h1').waitFor();
  await savePage.keyboard.press('Shift'); await savePage.waitForTimeout(500);
  assert.equal(await savePage.locator('video').count(), 0);
  report.checks.push('SaveData uses image even with forced video');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload(); await page.locator('.home-hero h1').waitFor();
  await page.keyboard.press('Shift'); await page.locator('video').waitFor();
  await page.locator('video').evaluate(v => v.dispatchEvent(new Event('error')));
  await page.locator('video').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.home-hero img.is-active').isVisible(), true);
  report.checks.push('Video error restores image hero');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  fs.writeFileSync(`${OUT}/capture-hero.json`, JSON.stringify(report, null, 2));
  await browser?.close(); await server.close();
}
