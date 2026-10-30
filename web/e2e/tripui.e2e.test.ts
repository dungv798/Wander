// Chỉ soạn e2e; cần orchestrator dành tài nguyên backend trước khi chạy.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import { withAria } from './diag.ts';
import type { Browser, Page } from 'playwright-core';
import { seedTrips } from './seed.ts';
import { api, TOKEN_KEY } from './backend.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';
test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
test.after(async () => { await browser?.close(); await server?.close(); });

/** Bỏ giới thiệu trước khi dựng chuyến qua backend; mỗi test có danh tính riêng. */
async function seeded(page: Page): Promise<string> {
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  const { tripId } = await seedTrips(page);
  await page.goto(`${baseUrl}/#/trip/${tripId}/ov`);
  await page.locator('.costbox').waitFor();
  return tripId;
}

test('390px: chi phí đầy đủ không cuộn ngang; sheet sát hai mép và giữ nấc khi đổi tab', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    const page = await ctx.newPage();
    await seeded(page);
    await page.locator('.costbox').scrollIntoViewIfNeeded();
    const dimensions = await page.locator('.costbox').evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    assert.ok(dimensions.scroll <= dimensions.client);
    const sheet = page.locator('.sheetbody');
    const rect = await sheet.boundingBox();
    assert.ok(rect);
    assert.equal(rect.x, 0);
    assert.equal(rect.x + rect.width, 390);
    const snap = await sheet.getAttribute('data-snap');
    await page.getByRole('tab', { name: 'Ngày 1', exact: true }).click();
    assert.equal(await sheet.getAttribute('data-snap'), snap);
    await page.getByRole('tab', { name: 'Tổng quan', exact: true }).click();
    await page.locator('.trip-cost-row').first().waitFor();
    const row = page.locator('.trip-cost-row').first();
    await row.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).waitFor();
  } finally { await ctx.close(); }
});

test('editor: Đã đặt giữ nguyên lưới; 1430 lưu HH:mm, hiện 14:30 và xóa được', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    const page = await ctx.newPage();
    const tripId = await seeded(page);
    await page.getByRole('tab', { name: 'Ngày 1', exact: true }).click();
    const row = page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' });
    await row.waitFor(); await row.click();
    const dialog = page.getByRole('dialog', { name: 'Sửa mục', exact: true });
    await dialog.waitFor();
    await dialog.getByLabel('Nhập nhanh 4 chữ số', { exact: true }).fill('1430');
    const group = dialog.getByRole('group', { name: 'Đặt chỗ', exact: true });
    await group.scrollIntoViewIfNeeded();
    const before = await group.boundingBox();
    const pendingBefore = await group.getByRole('button', { name: 'Chờ xác nhận', exact: true }).boundingBox();
    await group.getByRole('button', { name: 'Đã đặt', exact: true }).click();
    assert.equal(await group.getByRole('button', { name: 'Đã đặt', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await group.boundingBox(), before);
    assert.deepEqual(await group.getByRole('button', { name: 'Chờ xác nhận', exact: true }).boundingBox(), pendingBefore);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    await withAria(page, row, () => row.getByText(/14:30/).first().waitFor({ timeout: 8000 }));
    const token = await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}').token as string, TOKEN_KEY);
    const saved = await api('GET', `/api/trips/${tripId}`, token);
    assert.equal(saved.status, 200);
    const days = saved.body?.['days'] as { items: { title: string; timeOfDay: string | null }[] }[];
    assert.equal(days.flatMap(day => day.items).find(item => item.title === 'Ăn trưa (mẫu)')?.timeOfDay, '14:30');
    await row.click(); await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Xóa giờ', exact: true }).click();
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    await row.getByText('14:30', { exact: true }).waitFor({ state: 'detached' });
  } finally { await ctx.close(); }
});
