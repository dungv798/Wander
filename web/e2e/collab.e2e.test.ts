// Kiểm thử đầu-cuối Lát 1b (cộng tác) trên trình duyệt thật + backend thật: vào chuyến bằng liên kết mời, quyền theo vai, đề nghị xóa và duyệt, checklist.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { api, createOwner, field, loginAs } from './backend.ts';

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
      if (m.type() === 'error' && !m.text().includes('status of 4') && !m.text().includes('ERR_NETWORK_CHANGED')) errors.push(m.text());
    });
  });
  return { ctx, errors };
}

/** Trang sạch (bỏ qua giới thiệu), tùy chọn đăng nhập bằng bí mật phiên, rồi tới địa chỉ. */
async function open(ctx: BrowserContext, hash: string, token: string | null): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await page.reload();
  if (token) await loginAs(page, token);
  await page.goto(`${baseUrl}/${hash}`);
  return page;
}

/** Chuyến của Organizer có một mục tự do do Organizer thêm; trả mã chuyến, mã mục và mã mời. */
async function tripWithInvite(token: string): Promise<{ tripId: string; itemId: string; code: string }> {
  const created = await api('POST', '/api/trips', token, { name: 'Đà Lạt cuối tuần', destination: 'ha-giang', startDate: '2026-12-05', endDate: '2026-12-06' });
  const tripId = (created.body?.['trip'] as { id: string }).id;
  const item = await api('POST', `/api/trips/${tripId}/items`, token, { type: 'food', title: 'Bún chả Organizer' });
  const itemId = (item.body?.['item'] as { id: string }).id;
  const invite = await api('POST', `/api/trips/${tripId}/invites`, token, {});
  const code = (invite.body?.['invite'] as { code: string }).code;
  return { tripId, itemId, code };
}

test('khách vào bằng liên kết: thấy tên chuyến, vào được, mã bị gỡ khỏi địa chỉ, không có nút của Organizer; đề nghị xóa mục của Organizer rồi Organizer đồng ý', async () => {
  const owner = await createOwner();
  const { tripId, itemId, code } = await tripWithInvite(owner.token);
  const guest = await phone();
  const page = await open(guest.ctx, `#/join/${code}`, null);

  await page.getByRole('heading', { name: 'Bạn được mời đi cùng' }).waitFor();
  assert.match(await page.locator('body').innerText(), /Đà Lạt cuối tuần/);
  await page.getByLabel('Tên hiển thị của bạn').fill('Lan');
  await page.getByRole('button', { name: 'Vào chuyến đi' }).click();
  await page.locator('.thead h1').waitFor();
  assert.equal(await page.locator('.thead h1').textContent(), 'Đà Lạt cuối tuần');
  assert.ok(!page.url().includes(code), 'mã mời không còn trên địa chỉ');
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  assert.ok(!stored.includes(code), 'mã mời không được lưu vào localStorage');

  // thành viên không thấy nút của Organizer
  assert.equal(await page.getByRole('button', { name: 'Xóa chuyến đi' }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Sửa chuyến đi' }).count(), 0);

  // mở mục của Organizer: chỉ xem được, có nút đề nghị xóa
  await page.locator('.irow', { hasText: 'Bún chả Organizer' }).first().click();
  await page.getByRole('button', { name: 'Đề nghị xóa khỏi chuyến đi' }).click();
  await page.getByLabel('Lý do (không bắt buộc)').fill('Trùng bữa');
  await page.getByRole('button', { name: 'Gửi đề nghị' }).click();
  await page.getByText('Đã gửi đề nghị xóa').waitFor();

  const pending = await api('GET', `/api/trips/${tripId}/deletion-requests`, owner.token);
  assert.equal((pending.body?.['requests'] as unknown[]).length, 1);

  // Organizer duyệt trên giao diện
  const boss = await phone();
  const bossPage = await open(boss.ctx, `#/trip/${tripId}/ov`, owner.token);
  await bossPage.getByRole('button', { name: /^Đề nghị xóa \(1\)/ }).click();
  await bossPage.getByText(/Lan đề nghị xóa/).waitFor();
  await bossPage.getByRole('button', { name: 'Đồng ý xóa' }).click();
  await bossPage.getByText('Đã xử lý đề nghị').waitFor();
  const after = await api('GET', `/api/trips/${tripId}`, owner.token);
  const items = (after.body?.['items'] ?? (after.body?.['trip'] as { items?: { id: string }[] }).items ?? []) as { id: string }[];
  assert.ok(!items.some((i) => i.id === itemId), 'mục đã bị xóa mềm sau khi đồng ý');
  assert.deepEqual(guest.errors, []);
  assert.deepEqual(boss.errors, []);
  await guest.ctx.close();
  await boss.ctx.close();
});

test('liên kết sai hoặc đã thu hồi: một thông báo chung, không lộ lý do', async () => {
  const owner = await createOwner();
  const { tripId, code } = await tripWithInvite(owner.token);
  assert.equal((await api('DELETE', `/api/trips/${tripId}/invites/active`, owner.token)).status, 204);
  const { ctx, errors } = await phone();
  const page = await open(ctx, `#/join/${code}`, null);
  await page.getByRole('heading', { name: 'Liên kết không dùng được' }).waitFor();
  await page.getByRole('button', { name: 'Về Khám phá' }).click();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Organizer tạo liên kết và thấy thành viên trong "Người đi cùng"; checklist: thêm, khách tích phần mình, thấy tiến độ', async () => {
  const owner = await createOwner();
  const { tripId, code } = await tripWithInvite(owner.token);
  const joined = await api('POST', '/api/invites/join', (await createOwner()).token, { code, displayName: 'Minh' });
  assert.equal(field<string>(joined, 'tripId'), tripId);

  const boss = await phone();
  const page = await open(boss.ctx, `#/trip/${tripId}/ov`, owner.token);
  await page.getByLabel('Hạng mục').fill('Mang CCCD');
  await page.getByRole('button', { name: 'Thêm hạng mục' }).click();
  await page.getByText('Đã thêm hạng mục').waitFor();
  await page.getByRole('button', { name: /^Người đi cùng \(2\)/ }).click();
  await page.locator('.evlist li', { hasText: 'Minh' }).waitFor();
  await page.getByRole('button', { name: 'Tạo liên kết mời' }).or(page.getByRole('button', { name: 'Tạo liên kết mới' })).click();
  await page.getByText('Đã tạo liên kết mời').waitFor();
  assert.match(await page.locator('input[readonly]').inputValue(), /#\/join\/[A-Za-z0-9_-]{43}$/);
  await page.getByRole('button', { name: 'Đóng' }).click();
  const tick = page.getByRole('button', { name: 'Tôi đã chuẩn bị: Mang CCCD' });
  await tick.evaluate((el) => el.scrollIntoView({ block: 'center' })); // nút nổi "+" che mép dưới khi cuộn tối thiểu
  await tick.click({ timeout: 8000 });
  await page.getByText('1/2 người đã xong').waitFor();
  assert.deepEqual(boss.errors, []);
  await boss.ctx.close();
});
