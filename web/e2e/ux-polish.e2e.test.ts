import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { mockApi, readCatalog } from './support/capture-fixtures.mjs';

let server: ViteDevServer;
let browser: Browser;
let url = '';

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  url = server.resolvedUrls?.local[0] ?? '';
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
test.after(async () => { await browser?.close(); await server?.close(); });

/** Trang độc lập với API và nền bản đồ giả, không dùng backend/DB dùng chung. */
async function open(destination: string | null = null, hash = '/'): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.addInitScript(id => {
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
    localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));
    if (id) localStorage.setItem('wander.web.destination.v1', id);
  }, destination);
  await mockApi(page, readCatalog());
  await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, sources: {}, layers: [] } }));
  await page.goto(`${url}?intro=0#${hash}`);
  return page;
}

test('chưa chọn: lưới MỌI điểm đến của danh mục, không tự lưu Hà Giang; chọn mở điểm đến và có lối quẹt', async () => {
  const page = await open();
  const total = await page.evaluate(async () => ((await (await fetch('/api/catalog/destinations')).json()) as { destinations: unknown[] }).destinations.length);
  assert.ok(total >= 12, 'danh mục có ít nhất 12 điểm đến');
  await page.locator('.nh-card').nth(total - 2).waitFor({ state: 'attached' });
  assert.equal(await page.locator('.nh-grid .nh-card').count(), total - 1, 'hero và lưới cùng phủ mọi điểm đến, không lặp hero');
  assert.equal(await page.locator('.home-hero-card').count(), 1, 'một hero điểm đến gợi ý');
  assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), null);
  await page.locator('.nh-card', { hasText: 'Hà Nội' }).click();
  await page.waitForURL(/#\/dest\/ha-noi$/);
  await page.getByRole('button', { name: 'Quẹt khám phá', exact: true }).waitFor();
  await page.reload();
  assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), 'ha-noi');
  await page.close();
});

test('Điểm đến khác loại điểm hiện tại, đổi về trang chủ và giữ các nơi đã chọn/chuyến đi', async () => {
  const page = await open('ha-noi');
  await page.locator('.nh-grid .nh-card', { hasText: 'Hà Nội' }).click();
  await page.getByRole('button', { name: 'Quẹt khám phá', exact: true }).click();
  await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).click();
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.locator('#tabbar').getByRole('button', { name: 'Khám phá', exact: true }).click();
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  assert.equal(await page.locator('.nh-grid .nh-card', { hasText: 'Hà Nội' }).count(), 1);
  const decisions = await page.evaluate(() => JSON.parse(localStorage.getItem('wander.web.discover.v1') ?? '{}').decisions);
  await page.locator('.nh-grid .nh-card', { hasText: 'Đà Lạt' }).click();
  await page.locator('.dest-head h1', { hasText: 'Đà Lạt' }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('wander.web.discover.v1') ?? '{}').decisions), decisions);
  await page.locator('#tabbar').getByRole('button', { name: /Đã chọn/ }).click();
  await page.locator('.picked-headline', { hasText: 'Hà Nội' }).waitFor();
  await page.locator('.tilebtn').first().waitFor();
  await page.locator('#tabbar').getByRole('button', { name: /Chuyến đi/ }).click();
  await page.locator('.tcard', { hasText: 'Hà Giang' }).waitFor();
  await page.close();
});

test('Back/Escape giữ màn xuất phát; liên kết chuyến mở trực tiếp có lối về danh sách', async () => {
  const page = await open('ha-noi');
  await page.locator('.map-chrome .search').click();
  await page.locator('.destination-picker-header').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  await page.locator('#tabbar').getByRole('button', { name: /Chuyến đi/ }).click();
  await page.locator('.tcard').click();
  await page.waitForURL(/#\/trip\//);
  await page.keyboard.press('Escape');
  await page.waitForURL(/#\/trips$/);
  await page.goBack();
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  await page.close();
  const direct = await open('ha-noi', '/trip/look-ha-giang');
  await direct.locator('.mapbox .top .iconbtn').first().click();
  await direct.waitForURL(/#\/trips$/);
  await direct.close();
});

test('chủ đề Home đi cùng bộ lọc điểm đến và bộ thẻ quẹt', async () => {
  const page = await open();
  try {
    await page.locator('.nh-grid .nh-card').first().waitFor();
    const total = await page.locator('.nh-grid .nh-card').count();
    await page.locator('.home-topics').getByRole('button', { name: 'Trekking', exact: true }).click();
    await page.waitForFunction(n => { const cards = document.querySelectorAll('.nh-grid .nh-card'); return cards.length > 0 && cards.length < n; }, total);
    await page.locator('.home-hero-card .btn').click();
    await page.waitForURL(/#\/dest\/ha-giang\/leo$/);
    assert.equal(await page.locator('.pl-filters [aria-pressed="true"]').innerText(), 'Trekking');
    await page.getByRole('button', { name: 'Quẹt khám phá', exact: true }).click();
    await page.waitForURL(/#\/deck\/ha-giang$/);
    await page.getByRole('button', { name: 'Lọc theo loại', exact: true }).click();
    assert.equal(await page.locator('.filters [aria-pressed="true"]').innerText(), 'Trekking');
    assert.equal(await page.locator('.shell-map').count(), 1);
  } finally { await page.close(); }
});

test('điều khiển không có viền trình duyệt; form mở từ chi tiết giữ Tab và phím soạn thảo', async () => {
  for (const width of [390, 1440]) {
    const page = await open();
    try {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('.nh-grid .nh-card').first().waitFor();
      const rims = await page.locator('#screen button, #tabbar button').evaluateAll(elements => elements.filter(element => /outset|inset/.test(getComputedStyle(element).borderStyle)).map(element => element.textContent));
      assert.deepEqual(rims, []);
      if (width > 768) {
        const panel = await page.locator('#screen').boundingBox(), rail = await page.locator('#tabbar').boundingBox();
        assert.ok(panel && rail && panel.x > rail.x + rail.width, 'bảng nội dung không nằm sau rail');
      }
      await page.locator('.home-hero-card .btn').click();
      await page.locator('[data-place-id="cot-co-lung-cu"] .pr-photo').click();
      const before = await page.locator('.pd-count').textContent();
      await page.getByRole('button', { name: 'Chọn cho chuyến', exact: true }).click();
      const form = page.getByRole('dialog').last();
      await form.getByRole('textbox').first().fill('Chuyến cuối tuần');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('.pd-count').textContent(), before, 'phím soạn thảo không chuyển ảnh nền');
      for (let step = 0; step < 5; step++) {
        await page.keyboard.press('Tab');
        assert.ok(await form.evaluate(element => element.contains(document.activeElement)), 'focus ở trong form trên cùng');
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 1, 'Escape chỉ đóng form, giữ chi tiết');
    } finally { await page.close(); }
  }
});
