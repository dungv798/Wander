// Thử nghiệm `?fs=1`: trang cuộn nhẹ + app cố định (để Safari iPhone thu thanh); mặc định tắt; `?fs=0` tắt và xóa.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';

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

/** Đo trạng thái cuộn của trang và vị trí/kiểu của khung app. */
async function measure(page: Page): Promise<{ flag: string | undefined; position: string; scrollable: boolean; screenTop: number }> {
  return page.evaluate(() => ({
    flag: document.documentElement.dataset['fs'],
    position: getComputedStyle(document.querySelector('.app') as Element).position,
    scrollable: document.documentElement.scrollHeight > window.innerHeight + 50,
    screenTop: document.getElementById('screen')?.getBoundingClientRect().top ?? -1,
  }));
}

test('mặc định tắt; ?fs=1 bật (trang cuộn được, app cố định, cuộn trang không làm app dịch); ?fs=0 tắt lại', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  await ctx.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseUrl}/#/`);
    await page.waitForSelector('.sheet-toggle');
    const off = await measure(page);
    assert.equal(off.flag, undefined);
    assert.equal(off.scrollable, false, 'mặc định trang không cuộn (app tự quản cuộn)');

    await page.goto(`${baseUrl}/?fs=1#/`);
    await page.waitForSelector('.sheet-toggle');
    const on = await measure(page);
    assert.equal(on.flag, '1');
    assert.equal(on.position, 'fixed');
    assert.equal(on.scrollable, true, 'bật cờ thì trang cuộn được');
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(200);
    assert.equal((await measure(page)).screenTop, on.screenTop, 'cuộn trang không được làm tờ nội dung dịch chỗ (app cố định)');
    const box = await page.locator('.sheet-toggle').boundingBox();
    assert.ok(box, 'có tay nắm tờ');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 320, { steps: 8 });
    await page.mouse.up();
    await page.waitForSelector('.app[data-sheet="peek"]', { timeout: 5000 });

    await page.goto(`${baseUrl}/#/dest/ha-giang`);
    await page.waitForSelector('.sheet-toggle');
    assert.equal((await measure(page)).flag, '1', 'đã nhớ: không cần tham số ở lần mở sau');

    await page.goto(`${baseUrl}/?fs=0#/`);
    await page.waitForSelector('.sheet-toggle');
    const cleared = await measure(page);
    assert.equal(cleared.flag, undefined);
    assert.equal(cleared.scrollable, false);
  } finally {
    await ctx.close();
  }
});
