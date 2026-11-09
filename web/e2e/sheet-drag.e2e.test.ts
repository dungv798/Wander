// Tờ nội dung trên điện thoại kéo được: kéo xuống thu lại để xem bản đồ rộng hơn, kéo lên mở lại; kéo ngắn thì giữ nguyên; bấm tay nắm vẫn đổi.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';

const DRAG_PX = 320;
const SHORT_DRAG_PX = 24;
const SLOW_STEP_MS = 120;
const SETTLE_MS = 500;

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

/** Đặt chế độ của tờ mà test mong đợi (`open` hoặc `peek`) và chờ nó hiện trên `.app`. */
async function expectSheet(page: Page, mode: 'open' | 'peek'): Promise<void> {
  await page.waitForSelector(`.app[data-sheet="${mode}"]`, { timeout: 5000 });
}

/** Tâm của tay nắm tờ trong tọa độ trang. */
async function handleCenter(page: Page): Promise<{ x: number; y: number }> {
  const box = await page.locator('.sheet-toggle').boundingBox();
  assert.ok(box, 'có tay nắm tờ');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Kéo tay nắm theo chiều dọc `dy` px (dương = xuống); `slow` thì dừng giữa chừng để không bị tính là hất nhanh. */
async function dragHandle(page: Page, dy: number, slow = false): Promise<void> {
  const { x, y } = await handleCenter(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x, y + (dy * i) / steps);
    if (slow) await page.waitForTimeout(SLOW_STEP_MS);
  }
  await page.mouse.up();
  await page.waitForTimeout(SETTLE_MS);
}

test('kéo tay nắm xuống thì thu tờ, kéo lên thì mở lại; kéo ngắn giữ nguyên; bấm vẫn đổi', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  await ctx.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseUrl}/#/`);
    await page.waitForSelector('.sheet-toggle');
    await expectSheet(page, 'open');
    const openTop = await page.evaluate(() => document.getElementById('screen')?.getBoundingClientRect().top ?? 0);

    await dragHandle(page, SHORT_DRAG_PX, true);
    await expectSheet(page, 'open');

    await dragHandle(page, DRAG_PX);
    await expectSheet(page, 'peek');
    const peekTop = await page.evaluate(() => document.getElementById('screen')?.getBoundingClientRect().top ?? 0);
    assert.ok(peekTop > openTop + 200, `tờ phải tụt xuống rõ rệt khi thu (mở ${openTop} → thu ${peekTop})`);
    assert.equal(await page.evaluate(() => document.querySelector<HTMLElement>('.app')?.style.getPropertyValue('--sheet-drag-y') ?? ''), '', 'thả tay xong thì gỡ độ dịch tạm');

    await dragHandle(page, -DRAG_PX);
    await expectSheet(page, 'open');

    await page.locator('.sheet-toggle').click();
    await expectSheet(page, 'peek');
    await page.locator('.sheet-toggle').click();
    await expectSheet(page, 'open');
  } finally {
    await ctx.close();
  }
});
