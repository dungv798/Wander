// Chỉ chạy khi orchestrator đã dành tài nguyên backend/e2e.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';
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

test('4 chuyến: lọc/đếm, sắp xếp, tìm không dấu theo tên và điểm đến, xóa bộ lọc, nhớ sau tải lại', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-30T05:00:00Z'));
    const owner = await createOwner();
    const seeds = [
      { name: 'Ánh nắng', startDate: '2026-11-01', endDate: '2026-11-03' },
      { name: 'Đồi thông', startDate: '2026-10-29', endDate: '2026-10-31' },
      { name: 'Hè đã qua', startDate: '2026-09-01', endDate: '2026-09-03' },
      { name: 'Mùa chưa hẹn', startDate: '2026-12-01', endDate: '2026-12-03', datesTentative: true },
    ];
    for (const seed of seeds) assert.equal((await api('POST', '/api/trips', owner.token, { ...seed, destination: 'ha-giang' })).status, 201);
    await page.goto(`${baseUrl}/#/trips`);
    await loginAs(page, owner.token);
    await page.waitForFunction(() => document.querySelectorAll('.tcard').length === 4);
    for (const label of ['Sắp đi (1)', 'Đang đi (1)', 'Đã qua (1)', 'Chưa chốt ngày (1)']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('.tcard').length === 1);
      await page.getByRole('button', { name: label, exact: true }).click();
    }
    await page.getByRole('button', { name: /^Sắp xếp:/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Tên A-Z', exact: true }).click();
    assert.deepEqual(await page.locator('.tcard h3').allTextContents(), ['Ánh nắng', 'Đồi thông', 'Hè đã qua', 'Mùa chưa hẹn']);
    await page.getByRole('button', { name: /^Sắp xếp:/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Mới tạo', exact: true }).click();
    assert.equal(await page.locator('.tcard h3').first().innerText(), 'Mùa chưa hẹn');
    const search = page.getByRole('searchbox', { name: 'Tìm tên chuyến hoặc điểm đến' });
    await search.fill('DOI THONG');
    await page.waitForFunction(() => document.querySelectorAll('.tcard').length === 1);
    assert.equal(await page.locator('.tcard h3').innerText(), 'Đồi thông');
    await search.fill('ha giang');
    await page.waitForFunction(() => document.querySelectorAll('.tcard').length === 4);
    await search.fill('khong co');
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.tcard').length === 4);
    assert.equal(await search.inputValue(), '');
    await page.getByRole('button', { name: 'Sắp đi (1)', exact: true }).click();
    await search.fill('anh nang');
    await page.getByRole('button', { name: /^Sắp xếp:/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Tên A-Z', exact: true }).click();
    await page.reload();
    await page.locator('.tcard').waitFor();
    assert.equal(await search.inputValue(), 'anh nang');
    assert.equal(await page.getByRole('button', { name: 'Sắp đi (1)' }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('button', { name: 'Sắp xếp: Tên A-Z' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Chuyến đã xóa gần đây', exact: true }).count(), 1);
  } finally { await context.close(); }
});
