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

/** Đọc một tệp trong thư mục bản dựng. */
function built(file: string): string {
  return fs.readFileSync(path.join(outDir, file), 'utf8');
}

test('bản dựng: có manifest + meta để "Thêm vào Màn hình chính" chạy toàn màn hình (không còn thanh Safari)', () => {
  const html = built('index.html');
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest"/, 'index.html trỏ tới manifest');
  assert.match(html, /<meta name="theme-color" content="#[0-9a-f]{6}"/i, 'có theme-color');
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/, 'iOS chạy được ở chế độ toàn màn hình');
  const href = /<link rel="apple-touch-icon" href="([^"]+)"/.exec(html)?.[1];
  assert.ok(href && fs.existsSync(path.join(outDir, href)), 'biểu tượng apple-touch có thật trong bản dựng');
  const preloads = [...html.matchAll(/<link rel="preload" as="image" href="([^"]+)"/g)].map((m) => m[1] as string);
  assert.equal(preloads.length, 3, 'tải trước biểu tượng 3 tab (Khám phá, Đã chọn, Chuyến đi) để không hiện trễ sau chữ');
  for (const href of preloads) assert.ok(fs.existsSync(path.join(outDir, href)), `${href} có trong bản dựng`);
  const manifest = JSON.parse(built('manifest.webmanifest')) as { display: string; start_url: string; icons: { src: string; sizes: string }[] };
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192') && manifest.icons.some((i) => i.sizes === '512x512'), 'đủ biểu tượng 192 và 512');
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(outDir, icon.src)), `${icon.src} có trong bản dựng`);
});
