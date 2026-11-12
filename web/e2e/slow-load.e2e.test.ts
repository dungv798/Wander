// Máy chủ gói miễn phí ngủ khi vắng người: lần gọi đầu có thể mất ~1 phút. Kiểm: tải chậm thì app giải thích (không để người dùng nhìn khung xương im lặng), tải nhanh thì không.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';

const SLOW_NOTICE = 'Máy chủ đang thức dậy sau lúc nghỉ';
const SLOW_NOTICE_MS = 6000;
const SERVER_DELAY_MS = SLOW_NOTICE_MS + 2000;

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

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

/** Trang điện thoại đã xem giới thiệu; mỗi yêu cầu danh mục bị giữ `delayMs` mili giây trước khi đi tiếp (giả lập máy chủ vừa thức dậy). */
async function openDelayed(delayMs: number) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  await ctx.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  const page = await ctx.newPage();
  await page.route('**/api/catalog/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
  return { ctx, page };
}

test('tải chậm: sau vài giây hiện lời giải thích máy chủ đang thức dậy, rồi biến mất khi nội dung về', async () => {
  const { ctx, page } = await openDelayed(SERVER_DELAY_MS);
  try {
    await page.goto(`${baseUrl}/#/dest/ha-giang`);
    await page.waitForTimeout(1500);
    assert.equal(await page.getByText(SLOW_NOTICE).count(), 0, 'mới tải 1,5 giây: chưa cần giải thích');
    await page.getByRole('status').filter({ hasText: SLOW_NOTICE }).waitFor({ timeout: SLOW_NOTICE_MS + 3000 });
    await page.waitForSelector('.place-row', { timeout: SERVER_DELAY_MS + 8000 });
    assert.equal(await page.getByText(SLOW_NOTICE).count(), 0, 'nội dung đã về thì lời giải thích phải biến mất');
  } finally {
    await ctx.close();
  }
});

test('tải nhanh: không hiện lời giải thích', async () => {
  const { ctx, page } = await openDelayed(0);
  try {
    await page.goto(`${baseUrl}/#/dest/ha-giang`);
    await page.waitForSelector('.place-row');
    await page.waitForTimeout(SLOW_NOTICE_MS + 500);
    assert.equal(await page.getByText(SLOW_NOTICE).count(), 0);
  } finally {
    await ctx.close();
  }
});

test('hành động chờ máy chủ (lưu chuyến mới) quá ngưỡng cũng được giải thích, rồi biến mất khi xong (B-05)', async () => {
  const { ctx, page } = await openDelayed(0);
  try {
    await page.route('**/api/trips', async (route) => {
      if (route.request().method() === 'POST') await new Promise((resolve) => setTimeout(resolve, SERVER_DELAY_MS));
      await route.continue();
    });
    await page.goto(`${baseUrl}/#/dest/ha-giang`);
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Tạo chuyến đi', exact: true }).click();
    await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
    await page.getByRole('status').filter({ hasText: SLOW_NOTICE }).waitFor({ timeout: SLOW_NOTICE_MS + 3000 });
    await page.locator('.tcc-in h1').waitFor({ timeout: SERVER_DELAY_MS + 8000 });
    assert.equal(await page.getByText(SLOW_NOTICE).count(), 0, 'lưu xong thì lời giải thích phải biến mất');
  } finally {
    await ctx.close();
  }
});
