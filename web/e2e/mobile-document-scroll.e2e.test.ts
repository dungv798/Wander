import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';

let server: ViteDevServer;
let browser: Browser;
let url = '';
const SWIPE_STEPS = 12;
const SWIPE_STEP_MS = 16;
const SWIPE_RELEASE_HOLD_MS = 120;
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1';

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  url = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
test.after(async () => { await browser?.close(); await server?.close(); });

/** Hook ẩn/hiện thanh xử lý mỗi khung hình một lần: chờ hai khung để vị trí cuộn vừa đặt được ghi nhận trước lần cuộn tiếp (người dùng thật cuộn liên tục nhiều khung). */
async function settleFrames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** Vuốt cảm ứng trên nội dung thật; trình duyệt quyết định vùng cuộn theo CSS. */
async function swipeUp(page: Page, x: number, y: number, distance: number): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= SWIPE_STEPS; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - distance * i / SWIPE_STEPS }] });
    await page.waitForTimeout(SWIPE_STEP_MS);
  }
  // Giữ ngón trước khi nhả để kết thúc cuộn, tránh quán tính đua với bước đặt lại vị trí.
  await page.waitForTimeout(SWIPE_RELEASE_HOLD_MS);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

test('vuốt ảnh danh sách và vùng xem trước đều cuộn trang; không còn chuyển quyền giữa hai vùng cuộn', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: IPHONE_UA, reducedMotion: 'reduce' });
  // Kiểm cử chỉ/bố cục độc lập với mạng tile; bộ ảnh review riêng vẫn tải bản đồ thật.
  await context.route('https://**', route => route.abort());
  const page = await context.newPage();
  try {
    await page.goto(`${url}/?intro=0&fs=0`);
    await page.waitForSelector('.nh-grid li');
    const root = await page.evaluate(() => ({ scrollable: document.documentElement.scrollHeight > innerHeight, nested: getComputedStyle(document.querySelector('#screen') as Element).overflowY }));
    assert.ok(root.scrollable);
    assert.equal(root.nested, 'visible');
    await swipeUp(page, 150, 540, 260);
    await page.waitForFunction(() => window.scrollY > 100);
    await swipeUp(page, 150, 540, 200);
    await page.waitForFunction(() => window.scrollY > 300);
    assert.equal(await page.locator('#screen').evaluate(el => el.scrollTop), 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0);
    await swipeUp(page, 150, 210, 100);
    await page.waitForFunction(() => window.scrollY > 20);
    assert.equal(await page.locator('.app').getAttribute('data-sheet'), 'open', 'vuốt vùng xem trước không bị tính là bấm mở bản đồ');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  } finally { await context.close(); }
});

/** Bản đồ không làm mất vị trí đọc; điều hướng rời màn luôn gỡ khóa cuộn. */
async function checkMapRestore(activeBrowser: Browser): Promise<void> {
  const context = await activeBrowser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.route('https://**', route => route.abort());
  const page = await context.newPage();
  try {
    await page.goto(`${url}/?intro=0`);
    await page.waitForSelector('.nh-grid li');
    await page.evaluate(() => window.scrollTo(0, 640));
    await page.waitForFunction(() => window.scrollY === 640);
    await settleFrames(page);
    // Cuộn xuống làm thanh trượt ra; cuộn lên một chút (như người dùng thật) để nút Bản đồ hiện lại.
    await page.evaluate(() => window.scrollTo(0, 620));
    await page.waitForFunction(() => window.scrollY === 620 && document.documentElement.dataset['chrome'] === undefined);
    const cardBefore = await page.locator('.nh-card').first().boundingBox();
    await page.getByRole('button', { name: 'Bản đồ', exact: true }).click();
    assert.equal(await page.locator('#screen').evaluate(el => el.hasAttribute('inert')), true);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-scroll-locked')), true);
    assert.equal(await page.locator('.shell-map').evaluate(el => el.hasAttribute('inert')), false);
    await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
    await page.waitForFunction(() => window.scrollY === 620);
    const cardAfter = await page.locator('.nh-card').first().boundingBox();
    assert.equal(cardAfter?.y, cardBefore?.y);
    assert.equal(await page.locator('#screen').evaluate(el => el.hasAttribute('inert')), false);
    await page.getByRole('button', { name: 'Bản đồ', exact: true }).click();
    await page.locator('.map-chrome .search').click();
    await page.waitForSelector('.destination-picker-list');
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-scroll-locked')), false);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await page.locator('input[type="search"], .destination-picker-search input').fill('Huế');
    await page.getByRole('button').filter({ has: page.locator('strong', { hasText: 'Huế' }) }).click();
    await page.waitForSelector('.place-row');
    assert.equal(await page.locator('#screen').evaluate(el => getComputedStyle(el).overflowY), 'visible');
    await page.goBack();
    await page.waitForSelector('.destination-picker-list');
    await page.goBack();
    await page.waitForSelector('.nh-grid li', { state: 'attached' });
    assert.equal(await page.locator('.app').getAttribute('data-sheet'), 'open', 'Back về danh sách không được mở lại chế độ bản đồ cũ');
    await page.waitForSelector('.nh-grid li');
    await page.waitForFunction(() => window.scrollY === 620);
  } finally { await context.close(); }
}

test('Chrome: mở/đóng bản đồ trả đúng vị trí; tìm kiếm và chuyển điểm đến gỡ khóa nền', async () => checkMapRestore(browser));

test('WebKit: mở/đóng bản đồ và tìm kiếm giữ đúng vùng cuộn trên iPhone nhỏ', async () => {
  const safariEngine = await webkit.launch({ headless: true });
  try { await checkMapRestore(safariEngine); } finally { await safariEngine.close(); }
});

test('mở chi tiết địa điểm khóa nền, đóng trả vị trí; desktop vẫn dùng bảng cạnh bản đồ', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.route('https://**', route => route.abort());
  try {
    await page.goto(`${url}/?intro=0#/dest/ha-giang`);
    await page.waitForSelector('.place-row');
    await page.locator('.pr-title').nth(4).scrollIntoViewIfNeeded();
    const saved = await page.evaluate(() => window.scrollY);
    assert.ok(saved > 0);
    await page.locator('.pr-title').nth(4).click();
    await page.waitForSelector('[role="dialog"]');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden');
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - saved) < 1, 'khóa nền không được làm nhảy vị trí');
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    await page.waitForFunction(y => Math.abs(window.scrollY - y) < 1, saved);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-document-scroll'));
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    assert.equal(await page.locator('#screen').evaluate(el => getComputedStyle(el).position), 'absolute');
    assert.equal(await page.locator('.mobile-map-switch').count(), 0);
  } finally { await page.close(); }
});

test('cuộn xuống ẩn thanh trên/dưới, cuộn lên hoặc chạm cuối trang hiện lại; bản đồ mở thì không ẩn', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.route('https://**', route => route.abort());
  const page = await context.newPage();
  try {
    await page.goto(`${url}/?intro=0`);
    await page.waitForSelector('.nh-grid li');
    const chrome = (): Promise<string | undefined> => page.evaluate(() => document.documentElement.dataset['chrome']);
    assert.equal(await chrome(), undefined);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForFunction(() => document.documentElement.dataset['chrome'] === 'hidden');
    assert.equal(await page.locator('.map-chrome').evaluate(el => getComputedStyle(el).transform !== 'none'), true);
    await page.evaluate(() => window.scrollTo(0, 340));
    await page.waitForFunction(() => document.documentElement.dataset['chrome'] === undefined);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForFunction(() => document.documentElement.dataset['chrome'] === 'hidden');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => document.documentElement.dataset['chrome'] === undefined);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForFunction(() => window.scrollY === 800);
    await settleFrames(page);
    assert.equal(await chrome(), undefined, 'đi lên từ cuối trang vẫn hiện');
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForFunction(() => document.documentElement.dataset['chrome'] === 'hidden');
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForFunction(() => document.documentElement.dataset['chrome'] === undefined);
    await page.getByRole('button', { name: 'Bản đồ', exact: true }).click();
    assert.equal(await chrome(), undefined, 'bản đồ mở: thanh luôn hiện');
  } finally { await context.close(); }
});

/** Chi tiết địa điểm: mở được, không cuộn ngang, nền không nhảy. */
async function checkPlaceDetail(activeBrowser: Browser): Promise<void> {
  const context = await activeBrowser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.route('https://**', route => route.abort());
  const page = await context.newPage();
  try {
    await page.goto(`${url}/?intro=0#/dest/ha-giang`);
    await page.waitForSelector('.place-row');
    // Scroll by hand and click with `force`: Playwright's own scroll waits for the element to be "stable", which never happens
    // on headless WebKit under Linux (CI) because the list keeps repainting; this test is about the detail sheet, not about stability.
    await page.locator('.pr-title').nth(2).evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.locator('.pr-title').nth(2).click({ force: true });
    await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
    const widths = await page.locator('.place-scroll').evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    assert.ok(widths.scroll <= widths.client, `chi tiết địa điểm không được tràn ngang (${widths.scroll} > ${widths.client})`);
  } finally { await context.close(); }
}

test('Chrome: chi tiết địa điểm không tràn ngang', async () => checkPlaceDetail(browser));

test('WebKit: mở chi tiết địa điểm không crash và không tràn ngang', async () => {
  const safariEngine = await webkit.launch({ headless: true });
  try { await checkPlaceDetail(safariEngine); } finally { await safariEngine.close(); }
});
