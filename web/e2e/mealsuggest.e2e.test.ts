// Backend thật; orchestrator dành tài nguyên trước khi chạy, không tự chạy trong gói triển khai này.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { api, createOwner, loginAs } from './backend.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';
const DAY = '2026-11-01';

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});
test.after(async () => { await browser?.close(); await server?.close(); });

/** Dựng ba điểm Đà Lạt trung tâm có tọa độ, hoặc ba mục tự do không tọa độ, trên ngày thứ hai. */
async function seed(page: Page, coordinates: boolean) {
  const owner = await createOwner();
  const created = await api('POST', '/api/trips', owner.token, { name: 'Gợi ý bữa Đà Lạt', destination: 'da-lat', startDate: '2026-10-31', endDate: DAY });
  assert.equal(created.status, 201);
  const id = (created.body?.['trip'] as { id: string }).id;
  const catalog = await api('GET', '/api/catalog/destinations/da-lat', null);
  assert.equal(catalog.status, 200);
  const places = ((catalog.body?.['destination'] ?? catalog.body) as { places: { id: string; name: string; lat: number | null; lon: number | null }[] }).places;
  const selected = ['ho-xuan-huong', 'quang-truong-lam-vien', 'nha-tho-con-ga'].map(key => {
    const p = places.find(p => p.id === key);
    assert.ok(p && p.lat !== null && p.lon !== null, `Điểm ${key} phải có tọa độ`);
    return { id: p.id, name: p.name };
  });
  for (const [position, place] of selected.entries()) {
    const added = await api('POST', `/api/trips/${id}/items`, owner.token, { type: 'sightseeing', day: DAY, ...(coordinates ? { title: place.name, placeId: place.id } : { title: `Điểm tự do ${position + 1}` }) });
    assert.equal(added.status, 201);
  }
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/trip/${id}/2`);
  await page.getByRole('complementary', { name: 'Chưa có bữa trưa' }).waitFor();
  return { id, token: owner.token };
}

/** Mở đúng nhắc bữa trưa, không chọn nhầm nút cùng tên của bữa khác. */
async function openSuggestions(page: Page) {
  const reminder = page.getByRole('complementary', { name: 'Chưa có bữa trưa' });
  await reminder.getByRole('button', { name: 'Thêm bữa trưa', exact: true }).click();
  await reminder.getByRole('button', { name: 'Gợi ý quán gần lịch ngày này', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Gợi ý quán gần', exact: true });
  await sheet.waitFor();
  return sheet;
}

test('quán theo khoảng cách, ghi công, chọn chỉ điền editor; Lưu mới thêm mục tự do', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await ctx.newPage();
    let poiCalls = 0;
    page.on('request', request => { if (request.url().includes('/poi?')) poiCalls += 1; });
    const seeded = await seed(page, true);
    assert.equal(poiCalls, 0);
    const sheet = await openSuggestions(page);
    await sheet.locator('.meal-poi').nth(2).waitFor();
    const cards = await sheet.locator('.meal-poi').all();
    assert.ok(cards.length >= 3);
    const distances = await sheet.locator('[data-distance-m]').evaluateAll(nodes => nodes.map(n => Number(n.getAttribute('data-distance-m'))));
    assert.deepEqual(distances, distances.slice().sort((a, b) => a - b));
    assert.ok(await sheet.getByText('Dữ liệu OpenStreetMap, chưa xác minh hiện trạng', { exact: true }).isVisible());
    assert.ok(await sheet.getByRole('link', { name: /OpenStreetMap contributors.*ODbL/ }).isVisible());
    const name = await cards[0]!.locator('strong').innerText();
    await cards[0]!.click();
    const editor = page.getByRole('dialog', { name: 'Thêm mục tự do', exact: true });
    await editor.waitFor();
    assert.equal(await editor.getByLabel('Tên', { exact: true }).inputValue(), name);
    assert.equal(await editor.getByRole('combobox', { name: /^Ngày/ }).inputValue(), DAY);
    assert.equal(await editor.getByRole('combobox', { name: /^Loại/ }).inputValue(), 'food');
    assert.equal(await page.locator('.irow').count(), 3);
    const before = await api('GET', `/api/trips/${seeded.id}`, seeded.token);
    const count = (body: Record<string, unknown> | null) => (body?.['days'] as { items: unknown[] }[]).reduce((n, day) => n + day.items.length, 0);
    assert.equal(count(before.body), 3);
    const reloaded = page.waitForResponse(response => response.url().endsWith(`/api/trips/${seeded.id}`) && response.request().method() === 'GET' && response.ok());
    await editor.getByRole('button', { name: 'Lưu', exact: true }).click();
    await page.locator('.irow', { hasText: name }).waitFor();
    // Đợi dữ liệu GET sau ghi; toast/DOM lạc quan chưa đủ chứng minh đã lưu.
    await reloaded;
    const after = await api('GET', `/api/trips/${seeded.id}`, seeded.token);
    assert.equal(count(after.body), 4);
    const added = (after.body?.['days'] as { items: { title: string; placeId: string | null; note: string }[] }[]).flatMap(d => d.items).find(i => i.title === name);
    assert.ok(added);
    assert.equal(added.placeId, null);
    assert.match(added.note, /^Nguồn: OpenStreetMap/);
  } finally { await ctx.close(); }
});

test('không tọa độ có thông báo và Tự nhập, không gửi truy vấn POI', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await ctx.newPage();
    await seed(page, false);
    let calls = 0;
    page.on('request', request => { if (request.url().includes('/poi?')) calls += 1; });
    const sheet = await openSuggestions(page);
    await sheet.getByText('Ngày này chưa có địa điểm có tọa độ', { exact: true }).waitFor();
    await sheet.getByRole('button', { name: 'Tự nhập', exact: true }).click();
    await page.getByRole('dialog', { name: 'Thêm mục tự do', exact: true }).waitFor();
    assert.equal(calls, 0);
  } finally { await ctx.close(); }
});
