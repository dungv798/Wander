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

const SWIPE_STEPS = 12;
const SWIPE_STEP_MS = 16;

/** Vuốt cảm ứng THẬT lên `distance` px bắt đầu tại (x, y): chuỗi sự kiện chạm qua CDP (tuân theo touch-action; `synthesizeScrollGesture` không chạy trong headless). */
async function swipeUp(page: Page, x: number, y: number, distance: number): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= SWIPE_STEPS; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - (distance * i) / SWIPE_STEPS }] });
    await page.waitForTimeout(SWIPE_STEP_MS);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

/** Vị trí cuộn dọc của trang. */
function pageScrollY(page: Page): Promise<number> {
  return page.evaluate(() => window.scrollY);
}

/** Đo trạng thái cuộn của trang và vị trí/kiểu của khung app. */
async function measure(page: Page): Promise<{ flag: string | undefined; position: string; scrollable: boolean; screenTop: number; collapsed: boolean; scrolling: boolean; screenOverflowY: string; mapTouchAction: string }> {
  return page.evaluate(() => ({
    flag: document.documentElement.dataset['fs'],
    position: getComputedStyle(document.querySelector('.app') as Element).position,
    scrollable: document.documentElement.scrollHeight > window.innerHeight + 50,
    screenTop: document.getElementById('screen')?.getBoundingClientRect().top ?? -1,
    collapsed: document.documentElement.hasAttribute('data-fs-collapsed'),
    scrolling: document.documentElement.hasAttribute('data-fs-scrolling'),
    screenOverflowY: getComputedStyle(document.getElementById('screen') as Element).overflowY,
    mapTouchAction: getComputedStyle(document.querySelector('.tmroot') as Element).touchAction,
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
    assert.equal(on.collapsed, false, 'chưa thu thanh lúc mới mở');
    assert.equal(on.screenOverflowY, 'hidden', 'chưa thu thanh: tờ tạm không tự cuộn để vuốt dọc đi vào trang');
    assert.equal(on.mapTouchAction, 'pan-y', 'chưa thu thanh: bản đồ nhường vuốt dọc cho trang');
    // Cú vuốt dọc THẬT trên bản đồ (phần trên màn hình) phải cuộn trang: đó là cú vuốt làm Safari thu thanh.
    await swipeUp(page, 200, 120, 150);
    await page.waitForTimeout(400);
    assert.ok(await pageScrollY(page) >= 32, 'vuốt dọc trên bản đồ phải cuộn trang (chưa thu thanh)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-fs-collapsed'), null, { timeout: 2000 });
    // Vuốt dọc trên tờ nội dung cũng vậy.
    await swipeUp(page, 200, 600, 150);
    await page.waitForTimeout(400);
    assert.ok(await pageScrollY(page) >= 32, 'vuốt dọc trên tờ phải cuộn trang (chưa thu thanh)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-fs-collapsed'), null, { timeout: 2000 });
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-fs-scrolling'), null, { timeout: 2000 });
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-fs-scrolling'), null, { timeout: 2000 });
    const collapsed = await measure(page);
    assert.equal(collapsed.collapsed, true, 'cuộn quá ngưỡng thì coi là đã thu thanh');
    assert.notEqual(collapsed.screenOverflowY, 'hidden', 'đã thu thanh: tờ cuộn lại bình thường');
    assert.equal(collapsed.mapTouchAction, 'none', 'đã thu thanh: bản đồ nhận lại cử chỉ');
    assert.equal(collapsed.screenTop, on.screenTop, 'cuộn trang không được làm tờ nội dung dịch chỗ (app cố định)');
    const before = await pageScrollY(page);
    await swipeUp(page, 200, 120, 60);
    await page.waitForTimeout(400);
    assert.equal(await pageScrollY(page), before, 'đã thu thanh: vuốt trên bản đồ là kéo bản đồ, không cuộn trang');
    const box = await page.locator('.sheet-toggle').boundingBox();
    assert.ok(box, 'có tay nắm tờ');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 320, { steps: 8 });
    await page.mouse.up();
    await page.waitForSelector('.app[data-sheet="peek"]', { timeout: 5000 });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-fs-collapsed'), null, { timeout: 2000 });

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
