// Kiểm thử đầu-cuối của giới thiệu lần đầu 4 cảnh (S14, bản 02/11/2026) và Lịch mẫu (N-2) trên trình duyệt thật, khung điện thoại.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { preview } from 'vite';
import type { PreviewServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { storedTrips } from './seed.ts';

const ONBOARDING_KEY = 'wander.web.onboarding.v1';

let server: PreviewServer;
let browser: Browser;
let baseUrl = '';

test.before(async () => {
  server = await preview({ root: path.resolve(import.meta.dirname, '..'), configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), preview: { port: 0 }, logLevel: 'error' });
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => {
  await browser?.close();
  await new Promise<void>(resolve => server?.httpServer.close(() => resolve()));
});

/** Ngữ cảnh điện thoại 390×844 và danh sách lỗi console/trang. */
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

/** Trang sạch (xóa lưu trữ, CHƯA xem giới thiệu), tùy chọn đánh dấu đã xem, rồi tới địa chỉ. */
async function open(ctx: BrowserContext, url: string, seen = false): Promise<Page> {
  const page = await ctx.newPage();
  // đặt cờ "đã xem" TRƯỚC mã ứng dụng ở mọi lần nạp: tránh đua với trang cũ (đã nạp khi cờ còn trống) ghi đè lại lúc tải lại
  if (seen) await page.addInitScript((key) => localStorage.setItem(key, '{"done":true}'), ONBOARDING_KEY);
  await page.goto(`${baseUrl}/#/deck/ha-giang`);
  await page.evaluate(([key, done]) => {
    localStorage.clear();
    localStorage.setItem('wander.web.destination.v1', 'ha-giang');
    if (done) localStorage.setItem(key as string, '{"done":true}');
  }, [ONBOARDING_KEY, seen] as const);
  await page.goto(`${baseUrl}${url}`);
  await page.reload();
  return page;
}

/** Hàng trong tờ lịch: tên các địa điểm/khoảng nghỉ theo thứ tự hiện có. */
async function rowNames(page: Page): Promise<string[]> {
  return page.locator('.ob-row .ob-tx strong').allTextContents();
}

/** Đợi cảnh bản đồ ổn định: bản đồ thật sẵn sàng hoặc đã chuyển sang sơ đồ thay thế. */
async function mapSettled(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelector('.ob-map .tmroot[data-ready="1"]') !== null || document.querySelector('.ob-schematic') !== null, null, { timeout: 30_000 });
}

test('lần đầu vào Khám phá: giới thiệu 4 cảnh, đi hết bằng Tiếp/Quay lại, nhớ đã xem và không hiện lại', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.getByRole('heading', { name: 'Một nơi khiến bạn muốn lên đường.' }).waitFor();
  assert.match(page.url(), /#\/onboard$/);
  await page.getByText('Từ bữa sáng ở chợ đến những cung đường trên mây. Tìm điều bạn muốn trải nghiệm trên bản đồ.').waitFor();
  for (const name of ['Đà Lạt', 'Hà Giang', 'Tà Xùa']) await page.locator('.ob-fan b', { hasText: name }).waitFor();
  assert.equal(await page.locator('.ob-fan').count(), 3, 'ba thẻ điểm đến');
  assert.equal(await page.locator('.ob-dots button').count(), 4);
  assert.equal(await page.locator('.ob-dots button.on').getAttribute('aria-current'), 'step');
  assert.equal(await page.getByRole('button', { name: 'Bắt đầu khám phá' }).count(), 0, 'nút Bắt đầu khám phá chỉ hiện ở bước cuối');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('heading', { name: /Thích nơi nào, quẹt chọn nơi đó\./ }).waitFor();
  assert.equal(await page.getByRole('heading', { level: 1 }).evaluate((el) => document.activeElement === el), true, 'tiêu đề mới nhận focus');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('heading', { name: /Những nơi muốn đến, thành chuyến đi của bạn\./ }).waitFor();
  await page.locator('.ob-dots button').nth(3).click();
  await page.getByRole('heading', { name: /Gửi một liên kết\. Cùng nhau chốt chuyến\./ }).waitFor();
  await page.getByText('Chuyến đi minh họa').waitFor();
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).waitFor();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await page.getByRole('heading', { name: /Những nơi muốn đến/ }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Bắt đầu khám phá' }).count(), 0);
  await page.locator('.ob-dots button').nth(3).click();
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await page.locator('.nh-head').first().waitFor();
  assert.match(page.url(), /#\/$/);
  await page.reload();
  await page.locator('.nh-head').first().waitFor();
  assert.doesNotMatch(page.url(), /onboard/);
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), ONBOARDING_KEY), '{"done":true}');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Bỏ qua cũng nhớ đã xem; liên kết sâu không bị chuyển sang giới thiệu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.getByRole('button', { name: 'Bỏ qua' }).click();
  await page.locator('.nh-head').first().waitFor();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), ONBOARDING_KEY), '{"done":true}');
  const deep = await ctx.newPage();
  await deep.goto(`${baseUrl}/#/deck/ha-giang`);
  await deep.evaluate((k) => localStorage.removeItem(k), ONBOARDING_KEY);
  await deep.reload();
  await deep.locator('.card.front').waitFor();
  assert.match(deep.url(), /#\/deck\/ha-giang$/, 'liên kết sâu giữ nguyên');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('cảnh quẹt: demo tự chạy khi vào bằng Tiếp; chạm vào thẻ dừng demo; kéo thật chọn được; Xem lại chạy lại từ đầu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Đã chọn 0 nơi' }).waitFor();
  await page.getByText('Kéo sang phải để chọn').waitFor();
  await page.getByText('Nhả tay: nơi này được chọn').waitFor({ timeout: 20_000 });
  await page.getByRole('status').filter({ hasText: 'Đã chọn 1 nơi' }).waitFor({ timeout: 10_000 });
  await page.getByText('Kéo sang trái để bỏ qua').waitFor({ timeout: 20_000 });
  await page.getByText('Nhả tay: nơi này được bỏ qua').waitFor({ timeout: 20_000 });
  assert.equal(await page.getByRole('status').filter({ hasText: 'Đã chọn' }).textContent(), 'Đã chọn 1 nơi', 'bỏ qua không làm tăng số đã chọn');
  await page.getByText('Hoặc bấm ✕ / ✓ — cùng tác dụng').waitFor({ timeout: 10_000 });
  /* người xem chạm vào thẻ giữa lúc demo: demo dừng ngay, hiện Xem lại */
  await page.getByRole('button', { name: 'Xem lại' }).click();
  await page.getByRole('status').filter({ hasText: 'Đã chọn 0 nơi' }).waitFor();
  const card = page.locator('.ob-card.is-top');
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height * 0.6, { steps: 6 });
  assert.equal(await page.getByText('Kéo sang phải để chọn').count(), 0, 'chú thích của demo biến mất khi người xem chạm');
  await page.mouse.move(box.x + box.width / 2 + 170, box.y + box.height * 0.6, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('status').filter({ hasText: 'Đã chọn 1 nơi' }).waitFor({ timeout: 5_000 });
  await page.waitForTimeout(6_000);
  assert.equal(await page.getByRole('status').filter({ hasText: 'Đã chọn' }).textContent(), 'Đã chọn 1 nơi', 'demo không giành lại điều khiển');
  await page.getByRole('button', { name: 'Bỏ qua nơi này' }).click();
  await page.waitForTimeout(800); // thẻ trước còn đang bay: app chủ ý không nhận lượt quẹt chồng
  await page.getByRole('button', { name: 'Chọn nơi này' }).click();
  await page.getByRole('status').filter({ hasText: 'Đã chọn 2 nơi' }).waitFor({ timeout: 5_000 });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('cảnh bản đồ: lịch mẫu cố định đúng thứ tự, tab ngày bấm được, không phụ thuộc lựa chọn ở cảnh quẹt', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.locator('.ob-dots button').nth(2).click();
  await page.getByText('Đà Lạt · 2 ngày thong thả').first().waitFor();
  await mapSettled(page);
  await page.getByRole('tab', { name: 'Ngày 1' }).click();
  assert.deepEqual(await rowNames(page), ['Nhà thờ Con Gà', 'Quảng trường Lâm Viên', 'Hồ Xuân Hương', 'Chợ Đà Lạt']);
  assert.equal(await page.locator('.ob-row .ob-th b').allTextContents().then((n) => n.join('')), '1234', 'số khớp thứ tự ghim');
  await page.getByRole('tab', { name: 'Ngày 2' }).click();
  const day2 = await rowNames(page);
  assert.deepEqual(day2, ['Thiền viện Trúc Lâm', 'Ăn trưa, nghỉ ngơi', 'Thác Datanla', 'Hồ Tuyền Lâm']);
  await page.getByText('Thứ tự ghé thăm · không phải tuyến đường').waitFor();
  await page.getByRole('tab', { name: 'Tổng quan' }).click();
  await page.locator('.ob-dayhead .ob-badge', { hasText: 'Lịch trình minh họa' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('cảnh chia sẻ: mời → sao chép → bạn vào → đề xuất; từ chối giữ lịch; chấp nhận thêm Ga Đà Lạt đúng một lần, kể cả khi xem lại', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.locator('.ob-dots button').nth(3).click();
  await mapSettled(page);
  /* người xem tự thao tác ngay: phần tự chạy dừng */
  await page.getByRole('button', { name: 'Chia sẻ', exact: true }).click();
  await page.locator('.ob-panel.invite.on').waitFor();
  await page.getByRole('button', { name: 'Sao chép' }).click();
  await page.getByRole('button', { name: 'Đã sao chép' }).waitFor();
  await page.locator('.ob-panel.proposal.on').waitFor({ timeout: 15_000 });
  await page.getByText('Mai thêm một nơi muốn ghé').waitFor();
  assert.equal(await page.locator('.ob-members .ob-av').count(), 3, 'Bạn, Mai, Bảo');
  await page.getByRole('button', { name: 'Để xếp sau' }).click();
  await page.getByText('Giữ trong Chưa xếp ngày · lịch giữ nguyên').waitFor();
  assert.equal((await rowNames(page)).includes('Ga Đà Lạt'), false);
  /* xem lại rồi tự chạy thử: chấp nhận */
  await page.getByRole('button', { name: 'Xem lại' }).click();
  await page.getByRole('button', { name: 'Xếp vào Ngày 2' }).click({ timeout: 40_000 });
  await page.getByText('Đã thêm Ga Đà Lạt vào Ngày 2').waitFor();
  const rows = await rowNames(page);
  assert.equal(rows[0], 'Ga Đà Lạt');
  assert.equal(rows.filter((n) => n === 'Ga Đà Lạt').length, 1);
  assert.equal(await page.locator('.ob-row .ob-th b').allTextContents().then((n) => n.join('')), '1234');
  await page.getByRole('button', { name: 'Xem lại' }).click();
  await page.waitForTimeout(800);
  assert.equal((await rowNames(page)).includes('Ga Đà Lạt'), false, 'xem lại trả về lịch gốc, không nhân đôi');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('bản đồ nền không tải được: hiện sơ đồ minh họa, câu chuyện vẫn chạy, tab vẫn bấm được', async () => {
  const { ctx, errors } = await phone();
  await ctx.route(/openfreemap\.org/, (route) => route.abort());
  const page = await open(ctx, '/#/');
  await page.locator('.ob-dots button').nth(2).click();
  await page.getByText('Chưa tải được bản đồ nền · đang hiện sơ đồ minh họa').waitFor({ timeout: 20_000 });
  await page.locator('svg.ob-schematic').waitFor();
  await page.getByRole('tab', { name: 'Ngày 1' }).click();
  assert.equal((await rowNames(page)).length, 4);
  assert.equal(await page.locator('svg.ob-schematic image').count() > 0, true, 'ghim ảnh vẫn hiện trên sơ đồ');
  assert.deepEqual(errors.filter((e) => !/openfreemap|ERR_FAILED|Failed to load resource|Failed to fetch/i.test(e)), []);
  await ctx.close();
});

test('giảm chuyển động: cảnh quẹt hiện hai trạng thái chọn / bỏ qua bằng hình và chữ, không chạy demo', async () => {
  const browserCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN', reducedMotion: 'reduce' });
  const errors: string[] = [];
  browserCtx.on('page', (p) => p.on('pageerror', (e) => errors.push(e.message)));
  const page = await open(browserCtx, '/#/');
  await page.locator('.ob-dots button').nth(1).click();
  await page.getByText('Quẹt trái hoặc bấm ✕').waitFor();
  await page.getByText('Quẹt phải hoặc bấm ✓').waitFor();
  await page.getByText('BỎ QUA', { exact: true }).waitFor();
  await page.getByText('CHỌN', { exact: true }).waitFor();
  assert.equal(await page.locator('.ob-card').count(), 0, 'không dựng bộ bài chuyển động');
  assert.deepEqual(errors, []);
  await browserCtx.close();
});

test('Lịch mẫu (đã được PO duyệt 27/10: không còn nhãn nháp), xem theo ngày, dùng lịch này tạo chuyến có các nơi xếp đúng ngày và thứ tự', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/dest/ha-giang', true);
  await page.locator('.tplcard').first().waitFor();
  assert.equal(await page.locator('.tplcard .chip', { hasText: 'Bản nháp' }).count(), 0, 'lịch đã duyệt không còn nhãn Bản nháp');
  await page.locator('.tplcard').first().click();
  const dialog = page.getByRole('dialog');
  assert.equal(await dialog.getByText(/Bản nháp, chờ biên tập viên duyệt/).count(), 0);
  await dialog.getByRole('heading', { name: 'Ngày 3' }).waitFor();
  await dialog.getByRole('button', { name: 'Dùng lịch này' }).click();
  await dialog.getByLabel('Tên chuyến đi').fill('');
  await dialog.getByRole('button', { name: 'Tạo chuyến đi' }).click();
  await dialog.getByRole('alert').getByText('Tên chuyến đi không được để trống.').waitFor();
  await dialog.getByLabel('Tên chuyến đi').fill('Vòng cung của tôi');
  await dialog.getByRole('button', { name: 'Tạo chuyến đi' }).click();
  await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
  await page.locator('.tcc-in h1').waitFor();
  assert.equal(await page.locator('.tcc-in h1').textContent(), 'Vòng cung của tôi');
  const trip = (await storedTrips(page)).trips[0]!;
  const days = [...new Set(trip.items.map((i) => i.day))].sort() as string[];
  assert.equal(days.length, 3);
  assert.equal(trip.items.length, 7);
  assert.equal(trip.items.every((i) => i.day !== null), true, 'không còn mục "Chưa có ngày"');
  const day1 = trip.items.filter((i) => i.day === days[0]).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.placeId);
  assert.deepEqual(day1, ['cong-troi-quan-ba', 'dinh-vuong', 'pho-co-dong-van']);
  assert.equal(trip.endDate, days[2], 'ngày về = ngày đi + 2');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Lịch mẫu có ngày chuyển tiếp (không địa điểm mới) vẫn tạo chuyến đủ số ngày', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/dest/ha-giang', true);
  await page.locator('.tplcard', { hasText: 'Tây Côn Lĩnh' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Ngày dành cho chặng trước, chưa có nơi mới.').waitFor();
  await dialog.getByRole('button', { name: 'Dùng lịch này' }).click();
  await dialog.getByRole('button', { name: 'Tạo chuyến đi' }).click();
  await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
  await page.locator('.tcc-in h1').waitFor();
  const trip = (await storedTrips(page)).trips[0]!;
  assert.equal(trip.items.length, 2);
  const span = (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000;
  assert.equal(span, 2, 'chuyến 3 ngày dù ngày 2 trống');
  assert.deepEqual(errors, []);
  await ctx.close();
});
