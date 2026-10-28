// Kiểm thử đầu-cuối của giao diện web/ (pha FE, API giả) trên trình duyệt thật (Chrome hoặc Edge đã cài), khung nhìn điện thoại.
// Chạy: `npm run e2e` (tự mở máy chủ Vite có kho biên tập thật). KHÔNG thay thế `e2e/browser.test.ts` của gốc repo (chạy với backend Java, FE-10).
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';

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
  await page.getByRole('button', { name: 'Tìm điểm đến', exact: true }).click();
  const map = page.locator('.destination-picker-map');
  await page.locator('.destination-picker-list button').nth(11).waitFor();
  assert.equal(await page.locator('.destination-picker-list button').count(), 12);
  await page.waitForFunction(() => document.querySelector('.destination-picker-map')?.getAttribute('data-ready') === '1', undefined, { timeout: 30000 });
  const before = Number(await map.getAttribute('data-zoom'));
  await page.screenshot({ path: path.resolve(import.meta.dirname, '../../.logs/shot-destination-country.png') });
  await page.getByRole('searchbox').fill('đà lạt');
  await page.waitForFunction((zoom) => Number(document.querySelector('.destination-picker-map')?.getAttribute('data-zoom')) > zoom + 1, before, { timeout: 15000 });
  await page.screenshot({ path: path.resolve(import.meta.dirname, '../../.logs/shot-destination-da-lat.png') });
  await page.locator('.destination-picker-list button', { hasText: 'Đà Lạt' }).click();
  await page.locator('.dcard h3', { hasText: 'Đà Lạt' }).waitFor();
  await page.reload();
  await page.locator('.dcard h3', { hasText: 'Đà Lạt' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), 'da-lat');
  await ctx.close();
});
