// Kiểm thử đầu-cuối của giao diện web/ (pha FE, API giả) trên trình duyệt thật (Chrome hoặc Edge đã cài), khung nhìn điện thoại.
// Chạy: `npm run e2e` (tự mở máy chủ Vite có kho biên tập thật). KHÔNG thay thế `e2e/browser.test.ts` của gốc repo (chạy với backend Java, FE-10).
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { waitForNativeMap } from './mapChecks.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

/** Mở trang trắng (xóa lưu trữ) ở khung điện thoại và đi tới một địa chỉ hash. */
async function open(ctx: BrowserContext, hash: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.destination.v1', 'ha-giang');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); // bỏ qua giới thiệu lần đầu (có test riêng)
  });
  await page.reload(); // kho "đã xem giới thiệu" đọc lúc khởi tạo nên phải nạp lại
  await page.goto(`${baseUrl}/${hash}`);
  return page;
}

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => {
  await browser?.close();
  await server?.close();
});

/** Tạo ngữ cảnh điện thoại 390×844 và ghi lại lỗi console/trang để test khẳng định không có lỗi. */
async function phone(): Promise<{ ctx: BrowserContext; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN', colorScheme: 'light' });
  const errors: string[] = [];
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
  });
  return { ctx, errors };
}

/** Chọn Đà Lạt từ catalog thật, kiểm camera và lưu bền qua tải lại. */
test('chọn điểm đến: bản đồ Việt Nam bay tới Đà Lạt rồi giữ lựa chọn sau tải lại', async () => {
  const { ctx } = await phone();
  const page = await open(ctx, '#/');
  await page.locator('.map-chrome .search').click();
  const map = page.locator('.destination-picker-map');
  // Số điểm đến do danh mục backend quyết định (đang mở rộng), không hard-code.
  const total = await page.evaluate(async () => ((await (await fetch('/api/catalog/destinations')).json()) as { destinations: unknown[] }).destinations.length);
  assert.ok(total >= 12, 'kho danh mục có ít nhất 12 điểm đến');
  await page.locator('.destination-picker-list button').nth(total - 1).waitFor();
  assert.equal(await page.locator('.destination-picker-list button').count(), total);
  await page.waitForFunction(() => document.querySelector('.destination-picker-map')?.getAttribute('data-ready') === '1', undefined, { timeout: 30000 });
  const before = Number(await map.getAttribute('data-zoom'));
  await page.screenshot({ path: path.resolve(import.meta.dirname, '../../.logs/shot-destination-country.png') });
  await page.getByRole('searchbox').fill('đà lạt');
  await page.waitForFunction((zoom) => Number(document.querySelector('.destination-picker-map')?.getAttribute('data-zoom')) > zoom + 1, before, { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector<HTMLElement>('.destination-picker-map')?.dataset['pins'] === '1', undefined, { timeout: 15000 });
  assert.equal(await map.getAttribute('data-clusters'), '0', 'mốc điểm đến không bị gộp cụm');
  assert.equal(await map.locator('.tm-accessible button').textContent(), 'Đà Lạt');
  await page.screenshot({ path: path.resolve(import.meta.dirname, '../../.logs/shot-destination-da-lat.png') });
  await page.locator('.destination-picker-list button', { hasText: 'Đà Lạt' }).click();
  await page.waitForURL(/#\/dest\/da-lat$/);
  await page.evaluate(() => { location.hash = '#/'; });
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), 'da-lat');
  await ctx.close();
});

test('Đà Lạt đã lưu: không tải Hà Giang khi catalog chậm; ảnh ghim đến muộn vẫn thành symbol', async () => {
  const { ctx, errors } = await phone();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  const details: string[] = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/api\/catalog\/destinations\/[^/]+$/.test(pathname)) details.push(pathname);
  });
  let releaseCatalog!: () => void;
  let releasePhotos!: () => void;
  const catalogPending = new Promise<void>((resolve) => { releaseCatalog = resolve; });
  const photosPending = new Promise<void>((resolve) => { releasePhotos = resolve; });
  await page.route('**/api/catalog/destinations', async (route) => { await catalogPending; await route.continue(); });
  await page.route(/\/(?:catalog\/photos|look\/icons|assets\/map-photos)\//, async (route) => { await photosPending; await route.continue(); });
  try {
    const destinationRequest = page.waitForRequest(request => new URL(request.url()).pathname === '/api/catalog/destinations/da-lat');
    await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
    await destinationRequest;
    assert.ok(details.includes('/api/catalog/destinations/da-lat'));
    assert.equal(details.includes('/api/catalog/destinations/ha-giang'), false, 'không gọi API mặc định trước catalog');
    const catalogReady = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/catalog/destinations');
    releaseCatalog();
    await catalogReady;
    assert.equal(await page.locator('.home-map, .mapcard, .mapbig').count(), 0, 'không còn bản đồ nhúng ở trang chủ');
    await page.evaluate(() => { location.hash = '#/dest/da-lat'; }); // bản đồ CHÍNH của khung ứng dụng hiện các nơi của điểm đến
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.shell-map-view')?.dataset['ready'] === '1', undefined, { timeout: 45000 });
    // Ảnh còn chờ: bản đồ chính đã sẵn sàng và vẽ ghim giữ chỗ; bộ đếm data-pins chỉ chính xác sau khi ảnh về (nợ nhỏ, xem decisions.md).
    assert.equal(await page.locator('.shell-map-view').getAttribute('data-thumbnails'), '0');
    releasePhotos();
    try {
      await page.waitForFunction(() => {
        const map = document.querySelector<HTMLElement>('.shell-map-view');
        return Number(map?.dataset['pins']) > 0 && Number(map?.dataset['renderedImages']) === Number(map?.dataset['pins']);
      }, undefined, { timeout: 45000 });
    } catch (error) {
      const state = await page.evaluate(() => { const map = document.querySelector<HTMLElement>('.shell-map-view'); return map ? JSON.stringify({ ...map.dataset, features: undefined }) : 'không có .shell-map-view'; }).catch(() => 'không đọc được');
      throw new Error(`Ghim bản đồ chính chưa hiện ảnh sau khi nhả ảnh: ${state}`, { cause: error });
    }
    assert.equal(details.includes('/api/catalog/destinations/ha-giang'), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), 'da-lat');
    assert.deepEqual(errors, []);
  } finally {
    releaseCatalog();
    releasePhotos();
    await ctx.close();
  }
});

test('trang chủ: không có bản đồ nhúng; đúng một canvas; nút Bản đồ thu tờ để dùng bản đồ chính và mở lại được', async () => {
  const { ctx, errors } = await phone();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await page.goto(`${baseUrl}/#/`);
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  assert.equal(await page.locator('.home-map, .mapcard, .mapbig, .map-section').count(), 0, 'trang chủ không nhúng bản đồ riêng');
  await waitForNativeMap(page, '.shell-map-view');
  assert.equal(await page.locator('canvas.maplibregl-canvas').count(), 1, 'toàn trang chỉ có một canvas bản đồ');
  assert.equal(await page.locator('.app').getAttribute('data-sheet'), 'open');
  await page.getByRole('button', { name: 'Bản đồ', exact: true }).click();
  await page.locator('.app[data-sheet="peek"]').waitFor();
  assert.equal(await page.locator('canvas.maplibregl-canvas').count(), 1, 'thu tờ không tạo thêm bản đồ');
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await page.locator('.app[data-sheet="open"]').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Chuyến đi: bản đồ chính hiện ghim theo CHUYẾN của bạn, không phải điểm đến mặc định', async () => {
  const { ctx } = await phone();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await page.goto(`${baseUrl}/#/trips`);
  await page.locator('.shell-map[data-scene]').waitFor();
  // Chưa có chuyến nào: quay về cảnh cả nước (không dùng cảnh Đà Lạt đang chọn).
  assert.equal(await page.locator('.shell-map').getAttribute('data-scene'), 'overview');
  await ctx.close();
});
