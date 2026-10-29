// Dùng backend thật; chỉ chạy khi orchestrator đã dành tài nguyên e2e.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { api, createOwner, loginAs } from './backend.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';
const DAY = '2026-11-01';

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

/** Dựng ngày thứ hai có ba điểm qua API; ngày đầu rỗng giúp phát hiện editor chọn sai ngày. */
async function seed(page: Page): Promise<string> {
  const owner = await createOwner();
  const created = await api('POST', '/api/trips', owner.token, { name: 'Nhắc bữa', destination: 'ha-giang', startDate: '2026-10-31', endDate: DAY });
  assert.equal(created.status, 201);
  const id = (created.body?.['trip'] as { id: string }).id;
  for (const title of ['Đồi thông', 'Thác nước', 'Đỉnh núi']) {
    const added = await api('POST', `/api/trips/${id}/items`, owner.token, { type: 'sightseeing', title, day: DAY });
    assert.equal(added.status, 201);
  }
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/trip/${id}/2`);
  await page.getByRole('complementary', { name: 'Chưa có bữa trưa' }).waitFor();
  return id;
}

test('ba điểm: mở editor đúng ngày/loại, chỉ thêm sau xác nhận và bữa trưa hết nhắc', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await ctx.newPage();
    await seed(page);
    await page.getByRole('button', { name: 'Thêm bữa trưa', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Thêm mục tự do', exact: true });
    await editor.waitFor();
    assert.equal(await page.getByRole('dialog').count(), 1);
    // Field bọc select trong label, nên tên truy cập còn chứa chữ của các option.
    assert.equal(await editor.getByRole('combobox', { name: /^Ngày/ }).inputValue(), DAY);
    assert.equal(await editor.getByRole('combobox', { name: /^Loại/ }).inputValue(), 'food');
    assert.equal(await editor.getByLabel('Tên', { exact: true }).inputValue(), 'Ăn trưa');
    assert.equal(await page.locator('.irow').count(), 3);
    await editor.getByRole('button', { name: 'Lưu', exact: true }).click();
    await page.locator('.irow', { hasText: 'Ăn trưa' }).waitFor();
    await page.getByRole('complementary', { name: 'Chưa có bữa trưa' }).waitFor({ state: 'detached' });
  } finally { await ctx.close(); }
});

test('đóng nhắc còn hiệu lực sau tải lại', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await ctx.newPage();
    await seed(page);
    await page.getByRole('button', { name: 'Bỏ qua nhắc bữa trưa' }).click();
    await page.reload();
    await page.locator('.dayhead').waitFor();
    assert.equal(await page.getByRole('complementary', { name: 'Chưa có bữa trưa' }).count(), 0);
  } finally { await ctx.close(); }
});

