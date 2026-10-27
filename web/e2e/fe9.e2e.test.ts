// Kiểm thử đầu-cuối FE-9: Hôm nay, xem trước lưu/gửi lịch trình, Cài đặt, lỗi theo mã, hết phiên. Trình duyệt thật, khung điện thoại.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { TRIPS_KEY, seedIdentity, seedTrips } from './seed.ts';

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

/** Trang sạch (đã xem giới thiệu), tùy chọn nạp chuyến mẫu và danh tính mẫu, rồi tới địa chỉ hash. */
async function open(ctx: BrowserContext, hash: string, opts: { trips?: boolean; identity?: { withCode?: boolean; tablet?: boolean } } = {}): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  if (opts.trips) await seedTrips(page);
  if (opts.identity) await seedIdentity(page, opts.identity);
  await page.goto(`${baseUrl}/${hash}`);
  return page;
}

/** Ngày đi của chuyến mẫu đang lưu. */
async function startDate(page: Page): Promise<string> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').trips[0].startDate as string, TRIPS_KEY);
}

/** Ngày thứ `n` (0 = ngày đi) của chuyến mẫu. */
async function dayOf(page: Page, n: number): Promise<string> {
  const start = await startDate(page);
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

test('Hôm nay: trước ngày đi báo còn mấy ngày; giả lập ngày 1 thấy mục theo giờ và liên kết bản đồ; ngày 2 tích việc cần làm; sau ngày về báo kết thúc', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/today', { trips: true });
  await page.getByRole('heading', { name: 'Chưa tới ngày đi' }).waitFor();
  await page.getByText(/Còn 3 ngày nữa/).waitFor();
  await page.getByLabel('Giả lập ngày').fill(await dayOf(page, 0));
  await page.getByRole('heading', { name: /Ngày 1 ·/ }).waitFor();
  const links = page.locator('a.maplink');
  assert.ok((await links.count()) >= 1, 'địa điểm có tọa độ có liên kết mở bản đồ');
  assert.match((await links.first().getAttribute('href')) ?? '', /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=[\d.]+,[\d.]+$/);
  assert.equal(await links.first().getAttribute('rel'), 'noopener noreferrer');
  const times = await page.locator('.todayrow .tdtime').allTextContents();
  assert.deepEqual(times.filter((t) => /\d\d:\d\d/.test(t)), [...times.filter((t) => /\d\d:\d\d/.test(t))].sort(), 'mục có giờ xếp theo giờ');
  await page.getByLabel('Giả lập ngày').fill(await dayOf(page, 1));
  const toggle = page.getByRole('button', { name: /Hoàn thành: Đổ xăng trước khi lên đèo/ });
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await page.getByLabel('Giả lập ngày').fill(await dayOf(page, 5));
  await page.getByRole('heading', { name: 'Chuyến đi đã kết thúc' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Hôm nay: chưa có chuyến thì nói rõ; chuyến chưa chắc ngày không đoán ngày', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/today');
  await page.getByRole('heading', { name: 'Chưa có chuyến đi' }).waitFor();
  await page.evaluate((k) => {
    const s = { trips: [{ id: 'chua-chac', name: 'Chưa chắc', destinationId: 'ha-giang', startDate: '2026-12-01', endDate: '2026-12-03', datesTentative: true, kind: null, interests: [], styles: [], pace: null, budgetK: null, items: [], createdAt: 1 }] };
    localStorage.setItem(k, JSON.stringify(s));
  }, TRIPS_KEY);
  await page.reload();
  await page.getByRole('heading', { name: 'Chuyến này chưa chắc ngày' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Lưu hoặc gửi lịch trình: ba kiểu xem trước từ dữ liệu thật, tổng theo D17/D18, nói thẳng chưa tạo tệp, nút tạo tệp bị tắt', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/export/mau-ha-giang', { trips: true });
  await page.getByRole('heading', { name: 'Lưu hoặc gửi lịch trình' }).waitFor();
  assert.equal(await page.locator('.expcard').count(), 3, 'kiểu Ảnh: một thẻ mỗi ngày');
  await page.getByText(/3 mục “Chưa có ngày” sẽ không nằm trong bản xuất/).waitFor();
  const create = page.getByRole('button', { name: 'Tạo tệp (chưa làm)' });
  assert.equal(await create.isDisabled(), true);
  await page.getByRole('button', { name: 'PDF' }).click();
  await page.getByRole('columnheader', { name: 'Chi phí' }).waitFor();
  assert.match((await page.locator('.exptable tfoot').textContent()) ?? '', /750\.000\s₫/);
  await page.getByText('Đã bao gồm').first().waitFor();
  await page.getByRole('button', { name: 'Lịch' }).click();
  await page.getByText(/Múi giờ của thiết bị này/).waitFor();
  await page.getByText('Cả ngày').first().waitFor();
  await page.getByText(/chưa tạo được tệp Ảnh, PDF hay Lịch/).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Cài đặt: đổi tên thiết bị (kiểm rỗng/dài), quyền riêng tư ghi rõ là bản nháp, xem lại giới thiệu, hộp lỗi theo mã không đếm lần thử', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/settings', { identity: { withCode: true } });
  await page.getByRole('heading', { name: 'Cài đặt' }).waitFor();
  await page.getByText('Bản nháp, chưa phải chính sách pháp lý.').waitFor();
  await page.getByLabel('Tên thiết bị').fill('   ');
  await page.getByRole('button', { name: 'Lưu tên' }).click();
  await page.getByRole('alert').getByText('Tên thiết bị không được để trống.').waitFor();
  await page.getByLabel('Tên thiết bị').fill('Điện thoại của Dũng');
  await page.getByRole('button', { name: 'Lưu tên' }).click();
  await page.getByRole('status').getByText('Đã lưu tên thiết bị').waitFor();
  const name = await page.evaluate(() => JSON.parse(localStorage.getItem('wander.web.server.v1') ?? '{}').identity.devices[0].name);
  assert.equal(name, 'Điện thoại của Dũng');
  await page.getByRole('button', { name: 'RATE_LIMITED' }).click();
  const alert = page.locator('.errbox');
  await alert.getByText('Bạn thao tác hơi nhanh').waitFor();
  await alert.getByText('Mã lỗi: RATE_LIMITED').waitFor();
  assert.doesNotMatch((await alert.textContent()) ?? '', /còn \d+ lần/);
  await page.getByRole('button', { name: 'STEP_UP_REQUIRED' }).click();
  await page.locator('.errbox').getByRole('button', { name: 'Mở Bảo mật' }).click();
  await page.getByRole('heading', { name: 'Bảo mật' }).waitFor();
  await page.goto(`${baseUrl}/#/settings`);
  await page.getByRole('button', { name: 'Xem lại giới thiệu' }).click();
  await page.getByRole('heading', { name: 'Có một nơi đang đợi bạn' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('hết phiên nhánh A (còn mã khôi phục): dẫn tới Mở trên máy này', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/settings', { identity: { withCode: true } });
  await page.getByRole('button', { name: 'Giả lập: hết phiên' }).click();
  await page.getByRole('heading', { name: 'Phiên đã hết' }).waitFor();
  await page.getByRole('button', { name: 'Mở trên máy này' }).click();
  await page.getByRole('heading', { name: 'Mở chuyến đi trên máy này' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('hết phiên nhánh B (đã bỏ qua mã, không còn thiết bị khác): nói thẳng không khôi phục được, chỉ có Về Khám phá', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/settings', { identity: {} });
  await page.getByRole('button', { name: 'Giả lập: hết phiên' }).click();
  await page.getByRole('heading', { name: 'Không khôi phục được' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Mở trên máy này' }).count(), 0);
  await page.getByRole('button', { name: 'Về Khám phá' }).click();
  await page.locator('.hero-w, .sky').first().waitFor();
  // PO 27/10: sau nhánh B được bắt đầu danh tính mới, có cảnh báo rõ chuyến cũ mất vĩnh viễn
  await page.goto(`${baseUrl}/#/trips`);
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).first().click();
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).last().click();
  await page.getByText(/chuyến đi cũ sẽ mất vĩnh viễn/).waitFor();
  await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
  await page.locator('.thead h1').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});
