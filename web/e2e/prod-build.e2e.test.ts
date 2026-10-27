// Kiểm bản DỰNG thật (vite build + preview): các hộp "BẢN THỬ/GIẢ LẬP" dành cho phát triển KHÔNG được hiển thị cho người dùng.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, preview } from 'vite';
import type { PreviewServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';
import { seedIdentity } from './seed.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
let outDir = '';
let server: PreviewServer;
let browser: Browser;
let baseUrl = '';

test.before(async () => {
  outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wander-prod-'));
  await build({ root: ROOT, logLevel: 'error', build: { outDir, emptyOutDir: true } });
  server = await preview({ root: ROOT, logLevel: 'error', build: { outDir }, preview: { port: 0 } });
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => server?.httpServer.close(() => resolve()));
  if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
});

test('bản dựng: không hiển thị hộp BẢN THỬ/GIẢ LẬP ở Bảo mật, Cài đặt, Khôi phục và Hôm nay', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await seedIdentity(page, { withCode: true, tablet: true });
  for (const hash of ['#/security', '#/settings', '#/today']) {
    await page.goto(`${baseUrl}/${hash}`);
    await page.locator('h1, h2').first().waitFor();
    assert.equal(await page.locator('.protobox').count(), 0, `${hash} không được hiện hộp BẢN THỬ/GIẢ LẬP dành cho phát triển`);
  }
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  await page.goto(`${baseUrl}/#/recover`);
  await page.reload();
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByRole('button', { name: 'Hiện mã ghép' }).click();
  await page.locator('.pairbox').waitFor();
  assert.equal(await page.locator('.protobox').count(), 0, 'màn Khôi phục bằng thiết bị cũ không hiện nút giả lập duyệt');
  await ctx.close();
});
