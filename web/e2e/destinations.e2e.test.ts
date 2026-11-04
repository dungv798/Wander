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
  await page.getByRole('button', { name: /^Đổi điểm đến/ }).click();
  const map = page.locator('.destination-picker-map');
  await page.locator('.destination-picker-list button').nth(11).waitFor();
  assert.equal(await page.locator('.destination-picker-list button').count(), 12);
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
  await page.waitForURL(/#\/deck\/da-lat$/); // chọn xong đi thẳng tới bộ thẻ quẹt của điểm đến, không về trang chủ
  await page.evaluate(() => { location.hash = '#/'; });
  await page.locator('.nh-title h1', { hasText: 'Đà Lạt' }).waitFor();
  await page.reload();
  await page.locator('.nh-title h1', { hasText: 'Đà Lạt' }).waitFor();
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
  await page.route('**/catalog/photos/**', async (route) => { await photosPending; await route.continue(); });
  try {
    await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded' });
    await page.locator('.nh-title h1', { hasText: 'Đà Lạt' }).waitFor();
    assert.ok(details.includes('/api/catalog/destinations/da-lat'));
    assert.equal(details.includes('/api/catalog/destinations/ha-giang'), false, 'không gọi API mặc định trước catalog');
    const catalogReady = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/catalog/destinations');
    releaseCatalog();
    await catalogReady;
    assert.equal(await page.locator('.home-map .mapcard').count(), 0, 'chưa khởi tạo bản đồ trước khi cuộn');
    await page.evaluate(() => { location.hash = '#/dest/da-lat'; }); // bản đồ riêng ở màn điểm đến; thẻ bản đồ trang chủ có bài riêng
    await page.locator('.mapcard').scrollIntoViewIfNeeded(); // thẻ bản đồ nằm dưới màn hình, chỉ nạp khi cuộn tới
    await waitForNativeMap(page, '.mapcard');
    await page.getByRole('button', { name: /Mở rộng/ }).click();
    await page.getByRole('dialog', { name: 'Bản đồ Đà Lạt' }).waitFor();
    // Ảnh còn chờ: bản đồ mở rộng đã sẵn sàng và vẽ ghim giữ chỗ; bộ đếm data-pins chỉ chính xác sau khi ảnh về (nợ nhỏ, xem decisions.md).
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.mapbig')?.dataset['ready'] === '1', undefined, { timeout: 45000 });
    assert.equal(await page.locator('.mapbig').getAttribute('data-thumbnails'), '0');
    releasePhotos();
    try {
      await page.waitForFunction(() => {
        const map = document.querySelector<HTMLElement>('.mapbig');
        return Number(map?.dataset['pins']) > 0 && Number(map?.dataset['renderedImages']) === Number(map?.dataset['pins']);
      }, undefined, { timeout: 45000 });
    } catch (error) {
      const state = await page.evaluate(() => { const map = document.querySelector<HTMLElement>('.mapbig'); return map ? JSON.stringify({ ...map.dataset, features: undefined }) : 'không có .mapbig'; }).catch(() => 'không đọc được');
      throw new Error(`Ghim bản đồ mở rộng chưa hiện ảnh sau khi nhả ảnh: ${state}`, { cause: error });
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

test('trang chủ: thẻ bản đồ nhỏ chỉ khởi tạo khi cuộn tới, mở rộng và đóng được', async () => {
  const { ctx, errors } = await phone();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await page.goto(`${baseUrl}/#/`);
  await page.locator('.nh-title h1', { hasText: 'Đà Lạt' }).waitFor();
  assert.equal(await page.locator('.home-map .mapcard').count(), 0, 'chưa khởi tạo bản đồ trước khi cuộn');
  await page.locator('.home-map').scrollIntoViewIfNeeded();
  await waitForNativeMap(page, '.home-map .mapcard');
  await page.locator('#screen').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.waitForFunction(() => {
    const map = document.querySelector<HTMLElement>('.home-map .mapcard');
    const canvas = map?.querySelector('canvas');
    const screen = document.querySelector('#screen')?.getBoundingClientRect();
    const tab = document.querySelector('#tabbar')?.getBoundingClientRect();
    if (!map || !canvas || !screen || !tab) return false;
    const rect = map.getBoundingClientRect();
    let opacity = 1;
    for (let ancestor: HTMLElement | null = map; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.visibility !== 'visible' || style.display === 'none') return false;
      opacity *= Number(style.opacity);
    }
    return map.dataset['ready'] === '1' && canvas.width > 0 && canvas.height > 0
      && canvas.clientWidth > 0 && canvas.clientHeight > 0 && opacity === 1
      && rect.top >= Math.max(0, screen.top) && rect.bottom <= Math.min(innerHeight, screen.bottom, tab.top)
      && rect.left >= screen.left && rect.right <= screen.right;
  }, undefined, { timeout: 15000 });
  await page.getByRole('button', { name: /Mở rộng/ }).click();
  await page.getByRole('dialog', { name: 'Bản đồ Đà Lạt' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Bản đồ Đà Lạt' }).waitFor({ state: 'detached' });
  assert.deepEqual(errors, []);
  await ctx.close();
});
