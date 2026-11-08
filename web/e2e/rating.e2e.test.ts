import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';
import { TOKEN_KEY, api, createOwner } from './backend.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

/** Fixture dựa trên catalog thật (hai điểm), không phụ thuộc ô nền ngoài; rating và phiên dùng backend thật. */
async function detailFixture() {
  const raw = JSON.parse(await readFile(path.resolve(import.meta.dirname, '../../backend/src/main/resources/catalog/da-lat.json'), 'utf8'));
  const places = raw.places.slice(0, 2).map((place: { photos: { file: string }[] }) => ({
    ...place, categoryName: 'Cảnh quan', verdictLabel: 'Nên ghé', away: [],
    photos: place.photos.map(photo => ({ ...photo, url: `/catalog/photos/${photo.file}` })),
  }));
  return { ...raw, places, guide: [], coverUrl: places[0].photos[0].url, references: [{ id: 'center', name: 'Trung tâm', lat: places[0].lat, lon: places[0].lon, approximate: true }] };
}

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => { await browser?.close(); await server?.close(); });

/** Mở chi tiết một điểm với phiên thật của `token` (hoặc không có phiên); trả mã các điểm của fixture và các đường dẫn rating đã gọi. */
async function openDetail(token: string | null) {
  const fixture = await detailFixture();
  const ratingCalls: string[] = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN', reducedMotion: 'reduce' });
  await ctx.addInitScript(([key, value]: [string, string | null]) => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
    if (value) localStorage.setItem(key, JSON.stringify({ token: value }));
  }, [TOKEN_KEY, token] as [string, string | null]);
  await ctx.route('**/api/catalog/destinations*', route => route.fulfill({ json: { destinations: [{ ...fixture, lat: fixture.references[0].lat, lon: fixture.references[0].lon, placeCount: 2, bestMonths: [] }] } }));
  await ctx.route('**/api/catalog/destinations/da-lat', route => route.fulfill({ json: { destination: fixture } }));
  await ctx.route('https://tiles.openfreemap.org/**', route => route.fulfill({ status: 404, body: '' }));
  ctx.on('request', req => { if (new URL(req.url()).pathname.startsWith('/api/places/')) ratingCalls.push(`${req.method()} ${new URL(req.url()).pathname}`); });
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/deck/da-lat`);
  await page.locator('.card.front').waitFor();
  await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click();
  await page.locator('.place-content').waitFor();
  return { ctx, page, ratingCalls, placeIds: fixture.places.map((p: { id: string }) => p.id) as string[] };
}

/** Tổng số lượt chấm của các quán `placeIds` theo API thật, dưới góc nhìn của `token`. */
async function totalCount(token: string, placeIds: readonly string[]): Promise<number> {
  let total = 0;
  for (const id of placeIds) {
    const res = await api('GET', `/api/places/${id}/rating`, token);
    total += ((res.body?.['rating'] as { summary: { count: number } }).summary.count);
  }
  return total;
}

test('rating: chấm sao kèm lời bình, ghi ở backend thật, sửa và xóa được', async () => {
  const viewer = await createOwner();
  const { ctx, page, placeIds } = await openDetail(viewer.token);
  try {
    const card = page.locator('.rating-card');
    await card.waitFor();
    const before = await totalCount(viewer.token, placeIds);
    await card.getByRole('button', { name: 'Xem tất cả và viết đánh giá' }).click();
    await card.getByRole('button', { name: '4 sao' }).click();
    assert.equal(await card.getByRole('button', { name: '4 sao' }).getAttribute('aria-pressed'), 'true');
    await card.locator('textarea').fill('Cà phê thơm');
    await card.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await card.getByRole('button', { name: 'Cập nhật' }).waitFor();
    assert.equal(await totalCount(viewer.token, placeIds), before + 1, 'đúng một điểm mới của người xem được ghi ở backend');
    assert.match(await card.innerText(), /Cà phê thơm/);
    await card.getByRole('button', { name: 'Xóa đánh giá của tôi' }).click();
    await card.getByRole('button', { name: 'Gửi đánh giá' }).waitFor();
    assert.equal(await totalCount(viewer.token, placeIds), before, 'xóa trả về số lượt ban đầu');
  } finally { await ctx.close(); }
});

test('rating: báo cáo lời bình của người khác, lời bình biến mất khỏi danh sách của người báo cáo', async () => {
  const author = await createOwner();
  const viewer = await createOwner();
  const comment = `Quán hơi đông ${Date.now()}`;
  const { ctx, page, placeIds } = await openDetail(viewer.token);
  try {
    for (const id of placeIds) await api('PUT', `/api/places/${id}/rating`, author.token, { stars: 2, comment });
    await page.reload();
    await page.locator('.card.front').waitFor();
    await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click();
    const card = page.locator('.rating-card');
    await card.getByText(comment).waitFor();
    await card.getByRole('button', { name: 'Báo cáo' }).first().click();
    await page.getByText('Đã gửi báo cáo').waitFor();
    assert.equal(await card.getByText(comment).count(), 0, 'lời bình vừa báo cáo biến mất khỏi danh sách');
  } finally { await ctx.close(); }
});

test('rating: máy chưa có phiên thì không hiện thẻ và không gọi API rating', async () => {
  const { ctx, page, ratingCalls } = await openDetail(null);
  try {
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.rating-card').count(), 0);
    assert.equal(ratingCalls.length, 0, ratingCalls.join(','));
  } finally { await ctx.close(); }
});
