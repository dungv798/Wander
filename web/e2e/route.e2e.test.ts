// E2E mới: seed đúng ba địa điểm qua API thật, chạm canvas từ điểm kiểm chỉ đọc. Không chạy trong job triển khai.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Page } from 'playwright-core';
import { api, createOwner, loginAs } from './backend.ts';
import { sampleTripsState } from './seed.ts';
import { tapNativeFeature, waitForNativeMap } from './mapChecks.ts';

/** Tạo chuyến có đúng ba ghim của ngày đầu, dùng cùng dữ liệu và hợp đồng API của trips.e2e. */
async function seedRoute(page: Page): Promise<string> {
  const owner = await createOwner();
  const sample = sampleTripsState().trips[0]!;
  const created = await api('POST', '/api/trips', owner.token, { name: 'Tuyến ba điểm', destination: 'ha-giang', startDate: sample['startDate'], endDate: sample['endDate'] });
  assert.equal(created.status, 201);
  const id = (created.body?.['trip'] as { id: string }).id;
  for (const item of (sample['items'] as Record<string, unknown>[]).slice(0, 3)) {
    const result = await api('POST', `/api/trips/${id}/items`, owner.token, { placeId: item['placeId'], type: item['type'], title: item['placeId'], day: item['day'], timeOfDay: item['timeOfDay'], durationMin: item['durationMin'], included: false, booking: 'pending' });
    assert.equal(result.status, 201);
  }
  await loginAs(page, owner.token);
  return id;
}

/** Chọn tọa độ đoạn nằm xa ghim và ngoài tờ dưới; tương tác vẫn đi qua hit-test của renderer thật. */
async function tapSegment(page: Page) {
  const map = page.locator('.tmap');
  const box = await map.boundingBox();
  assert.ok(box);
  const segments = JSON.parse(await map.getAttribute('data-segments') ?? '[]') as { id: string; from: string; km: number; points: { x: number; y: number }[] }[];
  const pins = JSON.parse(await map.getAttribute('data-features') ?? '[]') as { id: string; x: number; y: number }[];
  for (const segment of segments) {
    for (const point of segment.points.filter(p => p.x > 30 && p.x < box.width - 30 && p.y > 80 && pins.every(pin => Math.hypot(pin.x - p.x, pin.y - p.y) > 35))) {
      const x = box.x + point.x, y = box.y + point.y;
      const exposed = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.classList.contains('maplibregl-canvas'), { x, y });
      if (!exposed) continue;
      await page.touchscreen.tap(x, y);
      return segment;
    }
  }
  throw new Error('Không có điểm chạm đoạn nằm trong vùng bản đồ nhìn thấy');
}

test('tuyến chạm được: thẻ tên/km, đóng, ghim ưu tiên và chi tiết giữ gallery từng ảnh', async () => {
  const server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
  try {
    for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const base = server.resolvedUrls!.local[0]!.replace(/\/$/, '');
    await page.route('https://tiles.openfreemap.org/styles/liberty', (route) => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'offline', type: 'background', paint: { 'background-color': 'rgb(240,240,240)' } }] } }));
    await page.goto(base);
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('wander.web.destination.v1', 'ha-giang'); localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); });
    const id = await seedRoute(page);
    await page.goto(`${base}/#/trip/${id}/un`);
    await waitForNativeMap(page, '.tmap');
    assert.ok(Number(await page.locator('.tmap').getAttribute('data-pins')) > 0, 'Chưa xếp phải có ghim trong vùng camera');
    await page.goto(`${base}/#/trip/${id}/1`);
    await waitForNativeMap(page, '.tmap');
    await page.waitForFunction(() => JSON.parse(document.querySelector<HTMLElement>('.tmap')?.dataset['segments'] ?? '[]').length === 2);
    if (width === 390) {
      await page.locator('.grab').press('ArrowDown');
      await page.locator('.sheetbody[data-snap="peek"]').waitFor();
      await waitForNativeMap(page, '.tmap');
    }
    const segment = await tapSegment(page);
    const card = page.locator('.tm-preview');
    await card.waitFor();
    assert.equal(await page.locator('.tmap').getAttribute('data-selected-segment'), segment.id);
    assert.match(await card.innerText(), new RegExp(`còn ~${Math.max(1, Math.round(segment.km))} km, ước tính`));
    const sourceName = await page.locator(`.tm-accessible button[data-id="${segment.from}"]`).innerText();
    assert.equal(await card.locator('h3').innerText(), sourceName.replace(/^\d+\. /, ''));
    await card.getByRole('button', { name: 'Đóng', exact: true }).click();
    await card.waitFor({ state: 'detached' });
    assert.equal(await page.locator('.tmap').getAttribute('data-selected-segment'), '');
    await tapNativeFeature(page, '.tmap', false);
    await card.waitFor();
    assert.equal(await page.locator('.tmap').getAttribute('data-selected-segment'), '', 'ghim ưu tiên khi nằm trên tuyến');
    const name = await card.locator('h3').innerText();
    await card.getByRole('button', { name: 'Xem chi tiết' }).click();
    const detail = page.getByRole('dialog', { name, exact: true });
    await detail.waitFor();
    const frame = detail.locator('.pd-photo');
    const images = frame.locator('img');
    assert.equal(await images.count(), 1, 'chi tiết hiển thị đúng một ảnh chính');
    const box = await frame.boundingBox();
    const image = await images.first().boundingBox();
    assert.ok(box && image && Math.abs(box.width - image.width) <= 1, 'ảnh đầy chiều rộng khung của nó (đúng tỷ lệ gốc, không letterbox)');
    const total = await detail.locator('.pd-count').count() ? Number((await detail.locator('.pd-count').textContent())?.split('/')[1]?.trim()) : 1;
    if (total > 1) {
      await detail.getByRole('button', { name: 'Ảnh sau' }).click();
      await page.waitForFunction(() => document.querySelector('.pd-count')?.textContent?.startsWith('2 /'));
    }
    await context.close();
    }
  } finally { await browser.close(); await server.close(); }
});
