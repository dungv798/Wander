/** Kiểm kho mới qua API production và xem các món/địa điểm ngoài Hà Giang ở hai cỡ màn. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { visibleReviewImagesReady } from '../web/scripts/reviewImages.mjs';
const base = 'http://127.0.0.1:8787';
const root = path.resolve(import.meta.dirname, '..');
const output = path.resolve(process.env.WANDER_CATALOG_REVIEW_OUT ?? path.join(root, '.logs/refinement-catalog-review'));
fs.mkdirSync(output, { recursive: true });
const expected = JSON.parse(fs.readFileSync(path.resolve(process.env.WANDER_CATALOG_AUDIT ?? path.join(root, 'docs/research/catalog-enrichment-audit-20261106.json')), 'utf8'));
const list = (await (await fetch(`${base}/api/catalog/destinations`)).json()).destinations;
assert.equal(list.length, expected.destinations);
const details = await Promise.all(list.map(async destination => (await (await fetch(`${base}/api/catalog/destinations/${destination.id}`)).json()).destination));
for (const summary of list) assert.deepEqual(summary.categories, [...new Set(details.find(d => d.id === summary.id).places.map(p => p.category))].sort());
assert.equal(details.reduce((sum, dest) => sum + dest.places.length, 0), expected.places);
assert.equal(details.reduce((sum, dest) => sum + dest.places.filter(place => place.category === 'am').length, 0), expected.foods);
assert.ok(details.every(dest => dest.places.some(place => place.category === 'am')));
const before = JSON.parse(fs.readFileSync(path.join(root, '.logs/refinement-catalog-before.json'), 'utf8'));
const oldIds = new Set(before.flatMap(entry => entry.data.places.map(place => place.id)));
const urls = [...new Set(details.flatMap(dest => dest.places.filter(place => !oldIds.has(place.id)).flatMap(place => place.photos.map(photo => photo.url))))];
for (let offset = 0; offset < urls.length; offset += 8) {
  const result = await Promise.allSettled(urls.slice(offset, offset + 8).map(async url => {
    const response = await fetch(new URL(url, base), { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type') ?? '', /^image\//);
  }));
  for (const entry of result) if (entry.status === 'rejected') throw entry.reason;
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const captures = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390, locale: 'vi-VN' });
    await context.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const id of ['hue', 'nha-trang', 'quy-nhon']) {
      await page.goto(`${base}/?intro=0#/dest/${id}/am`, { waitUntil: 'domcontentloaded' });
      const rows = page.locator('.place-row');
      await rows.first().waitFor();
      assert.equal(await rows.count(), details.find(dest => dest.id === id).places.filter(place => place.category === 'am').length);
      await rows.first().scrollIntoViewIfNeeded();
      await page.waitForFunction(visibleReviewImagesReady);
      const name = `${width}-${id}-food.png`;
      await page.screenshot({ path: path.join(output, name) });
      captures.push(name);
      if (id === 'hue') {
        await rows.first().locator('.pr-photo').click();
        await page.locator('.pd-photo img').waitFor();
        await page.waitForFunction(visibleReviewImagesReady);
        const overflow = await page.locator('[role="dialog"]').last().evaluate(panel => panel.scrollWidth > panel.clientWidth + 1);
        assert.equal(overflow, false);
        const detail = `${width}-hue-food-detail.png`;
        await page.screenshot({ path: path.join(output, detail) });
        captures.push(detail);
        await page.getByRole('dialog').last().getByRole('button', { name: 'Đóng', exact: true }).click();
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally { await browser.close(); }
const report = { status: 'PASS', destinations: details.length, places: expected.places, foods: expected.foods, newPhotoUrlsHttp200: urls.length, captures };
fs.writeFileSync(path.join(output, 'result.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
