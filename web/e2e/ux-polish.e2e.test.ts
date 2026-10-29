import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { mockApi, readCatalog } from '../../tools/look/capture-fixtures.mjs';

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

test('chưa chọn: carousel 12 điểm đến, không tự lưu Hà Giang; chọn đi thẳng tới bộ thẻ', async () => {
  const page = await open();
  await page.locator('.national-hero .destination-card').nth(11).waitFor({ state: 'attached' });
  assert.equal(await page.locator('.national-hero .destination-card').count(), 12);
  assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), null);
  await page.locator('.destination-card', { hasText: 'Hà Nội' }).click();
  await page.waitForURL(/#\/deck\/ha-noi$/);
  await page.reload();
  assert.equal(await page.evaluate(() => localStorage.getItem('wander.web.destination.v1')), 'ha-noi');
  await page.close();
});

test('Điểm đến khác loại điểm hiện tại, đổi về trang chủ và giữ các nơi đã chọn/chuyến đi', async () => {
  const page = await open('ha-noi');
  await page.locator('.home-destination-switch').waitFor();
  await page.getByRole('button', { name: 'Bắt đầu khám phá', exact: true }).click();
  await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).click();
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.locator('.other-destinations .destination-card').first().waitFor();
  assert.equal(await page.locator('.other-destinations .destination-card').count(), 6);
  assert.equal(await page.locator('.other-destinations .destination-card', { hasText: 'Hà Nội' }).count(), 0);
  const decisions = await page.evaluate(() => JSON.parse(localStorage.getItem('wander.web.discover.v1') ?? '{}').decisions);
  await page.locator('.other-destinations .destination-card', { hasText: 'Đà Lạt' }).click();
  await page.locator('.home-hero h1', { hasText: 'Đà Lạt' }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('wander.web.discover.v1') ?? '{}').decisions), decisions);
  await page.locator('#tabbar').getByRole('button', { name: /Đã chọn/ }).click();
  await page.locator('.pagehead .note', { hasText: 'Hà Nội' }).waitFor();
  await page.locator('.tilebtn').first().waitFor();
  await page.locator('#tabbar').getByRole('button', { name: /Chuyến đi/ }).click();
  await page.locator('.tcard', { hasText: 'Hà Giang' }).waitFor();
  await page.close();
});

test('Back/Escape giữ màn xuất phát; liên kết chuyến mở trực tiếp có lối về danh sách', async () => {
  const page = await open('ha-noi');
  await page.locator('.home-destination-switch').click();
  await page.locator('.destination-picker-header').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.home-hero h1').waitFor();
  await page.locator('#tabbar').getByRole('button', { name: /Chuyến đi/ }).click();
  await page.locator('.tcard').click();
  await page.waitForURL(/#\/trip\//);
  await page.keyboard.press('Escape');
  await page.waitForURL(/#\/trips$/);
  await page.goBack();
  await page.locator('.home-hero h1').waitFor();
  await page.close();
  const direct = await open('ha-noi', '/trip/look-ha-giang');
  await direct.locator('.mapbox .top .iconbtn').first().click();
  await direct.waitForURL(/#\/trips$/);
  await direct.close();
});
