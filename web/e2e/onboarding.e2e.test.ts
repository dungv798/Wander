// Kiểm thử đầu-cuối của giới thiệu lần đầu (S14) và Lịch mẫu (N-2, bản nháp) trên trình duyệt thật, khung điện thoại.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { storedTrips } from './seed.ts';

const ONBOARDING_KEY = 'wander.web.onboarding.v1';

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

test('lần đầu vào Khám phá: chuyển sang giới thiệu 3 cảnh, đi hết, nhớ đã xem và không hiện lại', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.getByRole('heading', { name: 'Có một nơi đang đợi bạn' }).waitFor();
  assert.match(page.url(), /#\/onboard$/);
  const bar = page.getByRole('progressbar');
  assert.equal(await bar.getAttribute('aria-valuenow'), '1');
  await page.getByText('Bản nháp nội dung').waitFor();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('heading', { name: 'Quẹt phải là mê, quẹt trái là thôi' }).waitFor();
  assert.equal(await page.getByRole('heading', { level: 1 }).evaluate((el) => document.activeElement === el), true, 'tiêu đề mới nhận focus');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('heading', { name: 'Rồi lịch tự thành hình' }).waitFor();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await page.getByRole('heading', { name: 'Quẹt phải là mê, quẹt trái là thôi' }).waitFor();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
  await page.locator('.home-hero').first().waitFor();
  assert.match(page.url(), /#\/$/);
  await page.reload();
  await page.locator('.home-hero').first().waitFor();
  assert.doesNotMatch(page.url(), /onboard/);
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), ONBOARDING_KEY), '{"done":true}');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Bỏ qua ở cảnh đầu cũng nhớ đã xem; liên kết sâu không bị chuyển sang giới thiệu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '/#/');
  await page.getByRole('button', { name: 'Bỏ qua' }).click();
  await page.locator('.home-hero').first().waitFor();
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
  await page.locator('.thead h1').waitFor();
  assert.equal(await page.locator('.thead h1').textContent(), 'Vòng cung của tôi');
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
  await page.locator('.thead h1').waitFor();
  const trip = (await storedTrips(page)).trips[0]!;
  assert.equal(trip.items.length, 2);
  const span = (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000;
  assert.equal(span, 2, 'chuyến 3 ngày dù ngày 2 trống');
  assert.deepEqual(errors, []);
  await ctx.close();
});
