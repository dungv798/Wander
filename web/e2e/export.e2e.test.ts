import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { seedTrips } from './seed.ts';

/** Dùng seed hiện có qua API, rồi nhận download thật; chỉ chạy khi orchestrator dành tài nguyên e2e. */
test('xuất chuyến thành PNG hợp lệ, xem trước khớp tệp tải xuống', async () => {
  const server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const url = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
    await page.goto(`${url}/#/`);
    await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
    const seeded = await seedTrips(page);
    await page.goto(`${url}/#/export/${seeded.tripId}`);
    const create = page.getByRole('button', { name: 'Tạo ảnh PNG', exact: true });
    await create.waitFor();
    assert.equal(await page.getByRole('button', { name: 'PDF · Sắp có' }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Lịch · Sắp có' }).isDisabled(), true);
    const pending = page.waitForEvent('download');
    await create.click();
    const download = await pending;
    assert.equal(await download.failure(), null);
    assert.match(download.suggestedFilename(), /\.png$/u);
    const file = await download.path();
    assert.ok(file);
    const png = await readFile(file);
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(png.readUInt32BE(16), 1080);
    const height = png.readUInt32BE(20);
    assert.ok(height >= 1350 && height <= 1920, `chiều cao theo nội dung, nhận ${height}`);
    const previewHash = await page.locator('.png-export-image').first().evaluate(async image => {
      const response = await fetch((image as HTMLImageElement).src);
      const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    });
    assert.equal(previewHash, createHash('sha256').update(png).digest('hex'), 'ảnh xem trước phải đúng là tệp tải về');
    await mkdir('../.logs/polish/export', { recursive: true });
    await writeFile('../.logs/polish/export/summary.png', png);
    await page.getByRole('button', { name: 'Theo từng ngày' }).click();
    const days = page.waitForEvent('download');
    await page.getByRole('button', { name: /^Tạo ảnh PNG|^Tải ảnh PNG/ }).first().click();
    const daysFile = await (await days).path();
    assert.ok(daysFile);
    await writeFile('../.logs/polish/export/days.png', await readFile(daysFile));
    } finally {
    await browser?.close(); await server.close();
  }
});
