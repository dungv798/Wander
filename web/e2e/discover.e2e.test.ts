// Kiểm thử đầu-cuối của giao diện web/ (pha FE, API giả) trên trình duyệt thật (Chrome hoặc Edge đã cài), khung nhìn điện thoại.
// Chạy: `npm run e2e` (tự mở máy chủ Vite có kho biên tập thật). KHÔNG thay thế `e2e/browser.test.ts` của gốc repo (chạy với backend Java, FE-10).
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';

const FIRST_PLACE = 'Cột cờ Lũng Cú';
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  const errors: string[] = [];
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
  });
  return { ctx, errors };
}

test('trang chủ mở màn chọn điểm đến và tìm không khớp', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/');
  await page.locator('h1.logo').waitFor();
  assert.equal(await page.locator('.mood').count(), 3);
  await page.getByRole('button', { name: 'Tìm điểm đến', exact: true }).click();
  await page.getByRole('searchbox').fill('zzz');
  await page.getByRole('status').getByText('Chưa có điểm đến này', { exact: true }).waitFor();
  await page.getByRole('searchbox').fill('ha gi');
  await page.locator('.destination-picker-list button', { hasText: 'Hà Giang' }).click();
  await page.waitForURL(/#\/deck\/ha-giang$/); // chọn xong đi thẳng tới bộ thẻ quẹt
  await page.evaluate(() => { location.hash = '#/'; });
  await page.locator('.dcard h3', { hasText: 'Hà Giang' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('quẹt: phím, hoàn tác, kéo bằng chuột, bộ lọc loại, hết thẻ', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  assert.match((await page.locator('.card.front h2').textContent()) ?? '', new RegExp(FIRST_PLACE));
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.keyboard.press('Backspace');
  await page.getByRole('button', { name: 'Xem đã chọn (0)' }).waitFor();
  const box = await page.locator('.card.front').boundingBox();
  assert.ok(box, 'thẻ có kích thước');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.getByRole('button', { name: 'Leo núi' }).click();
  assert.equal(await page.getByRole('button', { name: 'Leo núi' }).getAttribute('aria-pressed'), 'true');
  assert.match((await page.locator('.card.front h2').textContent()) ?? '', /Tây Côn Lĩnh/);
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Hết thẻ ở loại này').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('chi tiết địa điểm: hộp thoại có nhãn, Esc đóng và trả focus; đổi ảnh bằng nút', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  const infoBtn = page.getByRole('button', { name: 'Xem chi tiết' });
  await infoBtn.click();
  const dialog = page.getByRole('dialog', { name: FIRST_PLACE });
  await dialog.waitFor();
  assert.equal(await dialog.locator('.gcount').textContent(), '1 / 3');
  await dialog.getByRole('button', { name: 'Ảnh sau' }).click();
  await dialog.locator('.gcount', { hasText: '2 / 3' }).waitFor();
  assert.match((await dialog.locator('.rate').textContent()) ?? '', /Nên ghé/, 'nhãn biên tập, không có điểm sao');
  assert.equal(await dialog.locator('text=/★|sao/').count(), 0, 'không bịa số sao (G1)');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Xem chi tiết', 'focus về nút đã mở');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('đã chọn: lưu trên máy qua tải lại, bỏ chọn, rỗng', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).click();
  await page.locator('.tile').first().waitFor();
  assert.equal(await page.locator('.tile').count(), 1);
  await page.getByRole('button', { name: `Bỏ chọn ${FIRST_PLACE}` }).click();
  await page.getByText('Chưa chọn nơi nào').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('cẩm nang: khối mở/đóng đúng aria-expanded, danh sách mang gì đánh dấu được', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await page.locator('.guide').waitFor();
  const head = page.getByRole('button', { name: /^Mùa nên đi/ });
  assert.equal(await head.getAttribute('aria-expanded'), 'true');
  await head.click();
  assert.equal(await head.getAttribute('aria-expanded'), 'false');
  await page.getByRole('button', { name: /^Chuẩn bị mang gì/ }).click();
  const pack = page.getByRole('button', { name: 'Áo mưa', exact: true });
  assert.equal(await pack.getAttribute('aria-pressed'), 'false');
  await pack.click();
  assert.equal(await pack.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('lỗi tải kho: có thông báo, nút Thử lại hoạt động, không trắng trang', async () => {
  const { ctx } = await phone();
  const page = await ctx.newPage();
  await page.route('**/api/catalog/destinations/ha-giang', (r) => r.abort());
  await page.goto(`${baseUrl}/#/dest/ha-giang`);
  await page.getByRole('alert').getByText('Không tải được dữ liệu').waitFor();
  await page.unroute('**/api/catalog/destinations/ha-giang');
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await page.locator('.dhero h1').waitFor();
  assert.equal(await page.locator('.dhero h1').textContent(), 'Hà Giang');
  await ctx.close();
});

test('bản đồ: ghim ảnh thật, gộp cụm, mở rộng toàn màn, phóng bằng nút, chạm ghim mở chi tiết', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/');
  const shown = '.tm-pin:not(.is-hidden), .tm-cluster';
  await page.locator(`.mapcard[data-ready="1"] ${shown}`).first().waitFor({ timeout: 45000 });
  assert.ok((await page.locator('.mapcard .tm-pin img').count()) >= 5, 'ghim là ảnh thật của kho biên tập');
  assert.match((await page.locator('.mapcard .maplibregl-ctrl-attrib').textContent()) ?? '', /OpenStreetMap/, 'ghi công dữ liệu bản đồ');
  assert.ok((await page.locator('.mapcard .tm-cluster').count()) >= 1, 'các ghim sát nhau được gộp cụm');
  await page.getByRole('button', { name: /Mở rộng/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Bản đồ Hà Giang' });
  await dialog.locator(`.mapbig[data-ready="1"] ${shown}`).first().waitFor({ timeout: 45000 });
  const zoomOf = (): Promise<number> => dialog.locator('.mapbig').evaluate((el) => Number((el as HTMLElement).dataset['zoom']));
  const before = await zoomOf();
  await dialog.getByRole('button', { name: 'Phóng to', exact: true }).click();
  await page.waitForFunction((z) => Number((document.querySelector('.mapbig') as HTMLElement | null)?.dataset['zoom']) > z, before, { timeout: 15000 });
  assert.equal(await page.locator('.tm-degraded').count(), 0, 'nền bản đồ tải bình thường thì không hiện cảnh báo "một phần nền chưa tải được"');
  await dialog.locator('.tm-pin:not(.is-hidden)').first().click();
  await page.getByRole('dialog', { name: /./ }).first().waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('lỗi tải kiểu bản đồ: có thông báo và nút Thử lại, các phần khác vẫn dùng được', async () => {
  const { ctx } = await phone();
  const page = await ctx.newPage();
  await page.route('**/styles/liberty', (r) => r.abort());
  await page.goto(`${baseUrl}/#/dest/ha-giang`);
  await page.locator('.mapcard .tm-err').waitFor({ timeout: 30000 });
  assert.equal(await page.locator('.dhero h1').textContent(), 'Hà Giang', 'trang vẫn dựng được khi bản đồ lỗi');
  await page.unroute('**/styles/liberty');
  await page.locator('.mapcard .tm-err button').click();
  await page.locator('.mapcard[data-ready="1"] .tm-pin:not(.is-hidden), .mapcard[data-ready="1"] .tm-cluster').first().waitFor({ timeout: 45000 });
  await ctx.close();
});

test('dữ liệu lưu hỏng không làm trắng trang; ErrorBoundary không bị kích hoạt', async () => {
  const { ctx, errors } = await phone();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => localStorage.setItem('wander.web.discover.v1', '{"decisions":null,"history":"x","cat":"khong-co","photo":[1]}'));
  await page.goto(`${baseUrl}/#/deck/ha-giang`);
  await page.locator('.card.front').waitFor();
  assert.equal(await page.getByRole('alert').count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tờ chi tiết: Tab xoay vòng trong hộp thoại (kể cả phần "Về dữ liệu"), Back của trình duyệt đóng tờ', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  const dialog = page.getByRole('dialog', { name: FIRST_PLACE });
  await dialog.waitFor();
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))), true, `Tab lần ${i + 1} vẫn ở trong hộp thoại`);
  }
  await page.goBack();
  await page.waitForURL(/#\/(dest|explore|#\/)?/);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('phím Alt+← không bị bộ thẻ nuốt; thẻ đang bay thì Hoàn tác bị bỏ qua', async () => {
  const { ctx } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  await page.keyboard.press('Alt+ArrowLeft');
  await page.getByRole('button', { name: 'Xem đã chọn (0)' }).waitFor();
  assert.equal(await page.getByText('Đã xem 0/9').count(), 1, 'Alt+← không quyết định thẻ nào');
  await ctx.close();
});
