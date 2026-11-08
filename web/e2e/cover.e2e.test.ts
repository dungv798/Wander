// DR-031: trình duyệt + API thật; chỉ viết trong gói này, Claude chạy khi tài nguyên kiểm thử được dành riêng.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { api, createOwner, loginAs } from './backend.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => { await browser?.close(); await server?.close(); });

/** Mở chuyến đã seed bằng người cụ thể ở khung nhìn điện thoại. */
async function open(ctx: BrowserContext, token: string, tripId: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  await loginAs(page, token);
  await page.goto(`${baseUrl}/#/trip/${tripId}/ov`);
  await page.getByRole('tab', { name: 'Tổng quan', exact: true }).waitFor();
  return page;
}

/** Chuyến có giá lớn và ghi chú dưới thẻ Chi phí; các ngày tương lai giữ vị trí trong danh sách ổn định. */
async function seed(token: string): Promise<string> {
  const made = await api('POST', '/api/trips', token, { name: 'Bìa chuyến Hà Giang', destination: 'ha-giang', startDate: '2027-01-01', endDate: '2027-01-03' });
  assert.equal(made.status, 201);
  const id = (made.body?.['trip'] as { id: string }).id;
  const added = await api('POST', `/api/trips/${id}/items`, token, { type: 'lodging', title: 'Homestay', day: '2027-01-01', cost: 1500, booking: 'booked', note: 'Ghi chú cần đọc được phía trên nút nổi' });
  assert.equal(added.status, 201);
  return id;
}

/** Chỉ dùng locator trong đúng dialog, chờ phần tử trước khi kiểm số lượng hay lấy danh sách. */
async function choose(page: Page, label: string): Promise<void> {
  await page.locator('.sheet-scroll').evaluate(el => { el.scrollTop = 0; });
  await page.getByText('Quản lý chuyến đi', { exact: true }).click();
  await page.getByRole('button', { name: 'Tuỳ chỉnh bìa', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tuỳ chỉnh bìa' });
  await dialog.getByRole('button', { name: label, exact: true }).waitFor();
  const photos = dialog.locator('.trip-cover-choice img');
  await photos.first().waitFor();
  assert.ok(await photos.count() <= 12);
  await dialog.getByRole('button', { name: label, exact: true }).click();
  assert.equal(await dialog.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
  await dialog.getByRole('button', { name: 'Lưu bìa', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.locator('.toast').getByRole('button', { name: 'Hoàn tác', exact: true }).waitFor();
}

test('Organizer đổi gradient, Hoàn tác, còn sau tải lại; thành viên không thấy đổi; Tự động trả null', async () => {
  const organizer = await createOwner();
  const member = await createOwner();
  const id = await seed(organizer.token);
  const invited = await api('POST', `/api/trips/${id}/invites`, organizer.token);
  assert.equal(invited.status, 201);
  const code = (invited.body?.['invite'] as { code: string }).code;
  assert.equal((await api('POST', '/api/invites/join', member.token, { code, displayName: 'Bạn cùng đi' })).status, 201);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  try {
    const page = await open(ctx, organizer.token, id);
    await choose(page, 'Nắng sớm');
    await page.getByRole('tab', { name: 'Lịch', exact: true }).click();
    await page.getByRole('tab', { name: 'Ngày 1', exact: true }).waitFor();
    assert.equal(await page.locator('.toast').getByRole('button', { name: 'Hoàn tác', exact: true }).isVisible(), true);
    await page.locator('.toast').getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.trip-cover-card')?.getAttribute('data-cover') === 'photo');
    await page.getByRole('tab', { name: 'Tổng quan', exact: true }).click();
    await choose(page, 'Nắng sớm');
    await page.reload();
    await page.locator('.trip-cover-card[data-cover="gradient"]').waitFor();
    assert.deepEqual(((await api('GET', `/api/trips/${id}`, organizer.token)).body?.['trip'] as { cover: unknown }).cover, { kind: 'gradient', ref: 'cover-1' });
    const memberContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const guest = await open(memberContext, member.token, id);
      await guest.locator('.trip-cover-card[data-cover="gradient"]').waitFor();
      assert.equal(await guest.getByRole('button', { name: 'Tuỳ chỉnh bìa', exact: true }).count(), 0);
    } finally { await memberContext.close(); }
    await page.bringToFront();
    await choose(page, 'Tự động');
    await page.reload();
    await page.locator('.trip-cover-card[data-cover="photo"] img').waitFor();
    assert.equal(((await api('GET', `/api/trips/${id}`, organizer.token)).body?.['trip'] as { cover: unknown }).cover, null);
  } finally { await ctx.close(); }
});

test('số tiền không có trang trí gạch chân; cuối nội dung và ghi chú Chi phí cuộn hết vào trong màn hình (không còn nút nổi che)', async () => {
  const organizer = await createOwner();
  const id = await seed(organizer.token);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await open(ctx, organizer.token, id);
    await page.locator('.bigmoney b').waitFor();
    assert.match(await page.locator('.bigmoney b').innerText(), /1\.500\.000\s*₫/);
    const decorations = await page.locator('.bigmoney').evaluate(el => [el, ...el.querySelectorAll('*')].map(node => ({ line: getComputedStyle(node).textDecorationLine, border: getComputedStyle(node).borderBottomStyle, tag: node.tagName })));
    assert.ok(decorations.every(d => !d.line.includes('underline') && d.tag !== 'U' && d.border === 'none'));
    await page.locator('.sheet-scroll').evaluate(el => { el.scrollTop = el.scrollHeight; });
    await page.waitForFunction(() => {
      const scroller = document.querySelector('.sheet-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
      const last = document.querySelector('.tbody > :last-child')?.getBoundingClientRect();
      return last && last.bottom <= window.innerHeight;
    });
    const rects = await page.evaluate(() => ({ end: document.querySelector('.tbody > :last-child')!.getBoundingClientRect().bottom, note: document.querySelector('.trip-cost .note:last-of-type')!.getBoundingClientRect().bottom, height: window.innerHeight }));
    assert.ok(rects.end <= rects.height, JSON.stringify(rects));
    assert.ok(rects.note <= rects.height, JSON.stringify(rects));
  } finally { await ctx.close(); }
});
