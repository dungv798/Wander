import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { waitForNativeMap } from './mapChecks.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

/** Fixture dựa trên catalog thật, thu về hai điểm gần để không phụ thuộc backend hoặc ô nền ngoài. */
async function detailFixture() {
  const raw = JSON.parse(await readFile(path.resolve(import.meta.dirname, '../../backend/src/main/resources/catalog/da-lat.json'), 'utf8'));
  const places = raw.places.slice(0, 2).map((place: { photos: { file: string }[] }) => ({
    ...place, categoryName: 'Cảnh quan', verdictLabel: 'Nên ghé', away: [],
    photos: place.photos.map(photo => ({ ...photo, url: `/catalog/photos/${photo.file}` })),
  }));
  places[1].lat = places[0].lat - 0.0005;
  places[1].lon = places[0].lon - 0.001;
  return { ...raw, places, guide: [], coverUrl: places[0].photos[0].url,
    references: [{ id: 'center', name: 'Trung tâm', lat: places[0].lat - 0.001, lon: places[0].lon - 0.002, approximate: true }] };
}

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => { await browser?.close(); await server?.close(); });

/** Mở chi tiết bằng fixture API có tên/ảnh thật; nền phẳng và font trả lỗi ngay để MapLibre dùng font cục bộ. */
async function openDetail() {
  const fixture = await detailFixture();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await ctx.route('**/api/catalog/destinations*', route => route.fulfill({ json: { destinations: [{ ...fixture, lat: fixture.references[0].lat, lon: fixture.references[0].lon, placeCount: 2, bestMonths: [] }] } }));
  await ctx.route('**/api/catalog/destinations/da-lat', route => route.fulfill({ json: { destination: fixture } }));
  await ctx.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf', sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': 'rgb(238,242,247)' } }] } }));
  await ctx.route('https://tiles.openfreemap.org/fonts/**', route => route.fulfill({ status: 404, body: '' }));
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/deck/da-lat`);
  await page.locator('.card.front').waitFor();
  await page.locator('.actions .act').last().getByRole('button').click();
  await page.locator('.place-content').waitFor();
  return { ctx, page, fixture };
}

test('chi tiết: buổi đi mở/đóng và mô tả có trạng thái, điều khiển liên kết đúng', async () => {
  const { ctx, page } = await openDetail();
  try {
    const toggle = page.getByRole('button', { name: /Nên đi buổi nào/ });
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    const body = page.locator(`[id="${await toggle.getAttribute('aria-controls')}"]`);
    assert.equal(await body.getAttribute('aria-hidden'), 'false');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await body.getAttribute('inert'), '');
    const more = page.locator('.place-more');
    await more.click();
    assert.equal(await more.getAttribute('aria-expanded'), 'true');
    await more.click();
    assert.equal(await more.getAttribute('aria-expanded'), 'false');
  } finally { await ctx.close(); }
});

/** Kéo chuột vẫn được phép với cooperative gestures; mobile dùng hai ngón, nút zoom luôn dùng được. */
async function dragMap(page: Page) {
  const map = page.locator('.place-content .tm-mini');
  await map.scrollIntoViewIfNeeded();
  const box = await map.boundingBox();
  assert.ok(box);
  const center = await map.getAttribute('data-center');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 + 10, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(before => document.querySelector('.tm-mini')?.getAttribute('data-center') !== before, center);
}

test('chi tiết: kéo đổi tâm, zoom đổi mức và chạm ghim lân cận mở đúng địa điểm', async () => {
  const { ctx, page, fixture } = await openDetail();
  try {
    await page.getByRole('button', { name: /Đường đi/ }).click();
    await waitForNativeMap(page, '.tm-mini');
    await dragMap(page);
    const map = page.locator('.tm-mini');
    const zoom = Number(await map.getAttribute('data-zoom'));
    await map.locator('.maplibregl-ctrl-zoom-out').click();
    await page.waitForFunction(before => Number(document.querySelector('.tm-mini')?.getAttribute('data-zoom')) < before, zoom);
    const id = fixture.places[1].id;
    await page.waitForFunction(id => JSON.parse(document.querySelector('.tm-mini')?.getAttribute('data-features') ?? '[]').some((p: { id: string; cluster: boolean }) => p.id === id && !p.cluster), id);
    const feature = JSON.parse(await map.getAttribute('data-features') ?? '[]').find((p: { id: string }) => p.id === id);
    const box = await map.boundingBox();
    assert.ok(box && feature);
    await page.touchscreen.tap(box.x + feature.x, box.y + feature.y);
    await page.locator('.place-hero-meta h2', { hasText: fixture.places[1].name }).waitFor();
  } finally { await ctx.close(); }
});
