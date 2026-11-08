import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

test('lọc chủ đề trên metadata không tháo hero/lưới ảnh hoặc tải chi tiết toàn quốc', async () => {
  assert.equal(process.env['WANDER_E2E_DB'], 'wander_e2e');
  const base = process.env['WANDER_BASE_URL'] ?? 'http://127.0.0.1:8787';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      await context.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
      const page = await context.newPage();
      await page.goto(`${base}/?intro=0#/`);
      await page.locator('.home-hero-card').waitFor();
      let zoom = 0;
      if (width === 1440) {
        await page.waitForFunction(() => document.querySelector('.shell-map .tmroot')?.getAttribute('data-moving') === '0');
        zoom = await page.locator('.shell-map .tmroot').evaluate(el => Number((el as HTMLElement).dataset['zoom']));
        await page.locator('.shell-map .maplibregl-ctrl-zoom-in').click();
        await page.waitForFunction(previous => Number((document.querySelector('.shell-map .tmroot') as HTMLElement)?.dataset['zoom']) > previous + .5, zoom);
        await page.waitForFunction(() => document.querySelector('.shell-map .tmroot')?.getAttribute('data-moving') === '0');
        zoom = await page.locator('.shell-map .tmroot').evaluate(el => Number((el as HTMLElement).dataset['zoom']));
      }
      await page.evaluate(() => {
        const probe = { removed: 0 };
        Object.assign(window, { discoveryProbe: probe });
        new MutationObserver(records => records.forEach(record => record.removedNodes.forEach(node => {
          if (node instanceof Element && (node.matches('.home-hero-card, .nh-grid li') || node.querySelector('.home-hero-card, .nh-grid li'))) probe.removed++;
        }))).observe(document.querySelector('.national-home')!, { childList: true, subtree: true });
      });
      const details: string[] = [];
      page.on('request', request => { if (/\/api\/catalog\/destinations\/[^/]+$/.test(request.url())) details.push(request.url()); });
      await page.getByRole('button', { name: 'Món ăn', exact: true }).first().click();
      await page.waitForTimeout(1200);
      assert.equal(await page.evaluate(() => (window as unknown as { discoveryProbe: { removed: number } }).discoveryProbe.removed), 0, `${width}: bộ lọc giữ nguyên ảnh đang hiển thị`);
      assert.deepEqual(details, []);
      if (width === 1440) assert.ok(Math.abs(await page.locator('.shell-map .tmroot').evaluate(el => Number((el as HTMLElement).dataset['zoom'])) - zoom) < .01, 'Tất cả điểm đến đều có món ăn: giữ camera người xem đã phóng');
      await context.close();
    }
  } finally { await browser.close(); }
});
