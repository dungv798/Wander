import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { preview } from 'vite';
import type { PreviewServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';
import { mockApi, readCatalog } from '../../tools/look/capture-fixtures.mjs';
import type { DestinationDetail } from '../src/features/discover/model/Catalog.types.ts';

let server: PreviewServer;
let browser: Browser;
let base = '';
test.before(async () => {
  server = await preview({ root: path.resolve(import.meta.dirname, '..'), configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), preview: { port: 0 }, logLevel: 'error' });
  base = server.resolvedUrls!.local[0]!.replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
test.after(async () => { await browser?.close(); await new Promise<void>(resolve => server?.httpServer.close(() => resolve())); });

for (const mode of ['deck', 'detail'] as const) {
  test(`chuyển ảnh ${mode}: mạng chậm, bấm lùi khi đang tải và reduced-motion đều giữ ảnh liền mạch`, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    let release = (): void => {};
    try {
      const page = await context.newPage();
      const catalog = readCatalog() as DestinationDetail[];
      await mockApi(page, catalog);
      await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, sources: {}, layers: [] } }));
      await page.addInitScript(() => {
        localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
        localStorage.setItem('wander.web.destination.v1', 'ha-giang');
        localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));
      });
      await page.goto(`${base}/?intro=0#/${mode === 'deck' ? 'deck' : 'dest/ha-giang'}`, { waitUntil: 'domcontentloaded' });
      if (mode === 'detail') await page.locator('[data-place-id="exp-cho-phien"] .pr-photo').click();
      const image = page.locator(mode === 'deck' ? '.card.front img.ph' : '.pd-photo img');
      await image.waitFor();
      await page.waitForFunction(selector => {
        const photo = document.querySelector<HTMLImageElement>(selector);
        return photo?.complete && photo.naturalWidth > 0 && photo.dataset['imageReady'] === 'true';
      }, mode === 'deck' ? '.card.front img.ph' : '.pd-photo img');
      const original = await image.getAttribute('src');
      const second = catalog.find(destination => destination.id === 'ha-giang')!.places.find(place => place.id === 'exp-cho-phien')!.photos[1]!.url;
      const gate = new Promise<void>(resolve => { release = resolve; });
      await page.route(`**${second}`, async route => { await gate; await route.continue(); });
      await page.locator(mode === 'deck' ? '.card.front .card-photo-controls button:last-child' : '.pd-next').click();
      await page.waitForTimeout(150);
      assert.equal(await image.getAttribute('src'), original, 'không thay src rồi che ảnh đang xem khi ảnh mới còn chờ mạng');
      assert.ok(await image.evaluate(element => Number(getComputedStyle(element).opacity)) > 0.95, 'không nhấp nháy từ nền trống');
      await page.locator(mode === 'deck' ? '.card.front .card-photo-controls button:first-child' : '.pd-prev').click();
      release();
      await page.waitForTimeout(350);
      assert.equal(await image.getAttribute('src'), original, 'kết quả tải muộn không được ghi đè thao tác lùi vừa chọn');
      await page.locator(mode === 'deck' ? '.card.front .card-photo-controls button:last-child' : '.pd-next').click();
      await page.waitForFunction(({ selector, target }) => {
        const photo = document.querySelector<HTMLImageElement>(selector);
        return !!photo && photo.getAttribute('src') === target && photo.complete && photo.naturalWidth > 0 && photo.dataset['imageReady'] === 'true';
      }, { selector: mode === 'deck' ? '.card.front img.ph' : '.pd-photo img', target: second });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator(mode === 'deck' ? '.card.front .card-photo-controls button:first-child' : '.pd-prev').click();
      await page.waitForFunction(({ selector, target }) => document.querySelector(selector)?.getAttribute('src') === target, { selector: mode === 'deck' ? '.card.front img.ph' : '.pd-photo img', target: original });
      assert.equal(await page.locator('.image-outgoing').count(), 0, 'reduced-motion không còn lớp chạy crossfade');
    } finally { release(); await context.close(); }
  });
}

test('ảnh lazy ngoài vùng nhìn không bị hook tải sớm; cuộn tới mới tải và giải mã', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const catalog = readCatalog() as DestinationDetail[];
    const place = catalog.find(destination => destination.id === 'ha-giang')!.places.at(-1)!;
    // Bản đồ cũng dùng ảnh ghim: bỏ riêng tọa độ của fixture để đo lazy img, không đo lượt tải hợp lệ của atlas bản đồ.
    const isolated = catalog.map(destination => destination.id === 'ha-giang' ? { ...destination, places: destination.places.map(item => item.id === place.id ? { ...item, lat: null, lon: null } : item) } : destination);
    await mockApi(page, isolated);
    await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, sources: {}, layers: [] } }));
    await page.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
    const target = place.photos[0]!.url;
    let fetched = false;
    page.on('request', request => { if (request.url().endsWith(target)) fetched = true; });
    await page.goto(`${base}/?intro=0#/dest/ha-giang`, { waitUntil: 'domcontentloaded' });
    const photo = page.locator(`[data-place-id="${place.id}"] .pr-photo img`);
    await photo.waitFor({ state: 'attached' });
    assert.equal(await photo.getAttribute('loading'), 'lazy');
    const top = await photo.evaluate(element => element.getBoundingClientRect().top);
    assert.ok(top > 4000, 'fixture phải nằm xa ngưỡng preload của browser');
    await page.waitForTimeout(150);
    assert.equal(fetched, false);
    await photo.scrollIntoViewIfNeeded();
    await page.waitForFunction(src => [...document.images].some(image => image.getAttribute('src') === src && image.dataset['imageReady'] === 'true'), target);
    assert.equal(fetched, true);
  } finally { await context.close(); }
});
