import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { seedIdentity, storedTrips } from '../web/e2e/seed.ts';
import { visibleReviewImagesReady } from '../web/scripts/reviewImages.mjs';

const { chromium } = createRequire(new URL('../web/package.json', import.meta.url))('playwright-core');
const base = process.env.WANDER_REVIEW_BASE ?? 'http://127.0.0.1:8787';
const out = path.resolve(process.env.WANDER_REVIEW_OUT ?? '.logs/b-fidelity-user-journey');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];

/** Chụp bước đang thao tác và kiểm cả tràn bên trong các bảng, không chỉ chiều rộng document. */
async function step(page, width, name) {
  await page.waitForFunction(visibleReviewImagesReady);
  const map = page.locator('.shell-map .tmroot, .tmap').first();
  if (await map.isVisible()) await page.waitForFunction(() => { const host = document.querySelector('.shell-map .tmroot, .tmap'); return host?.dataset.ready === '1' && host.dataset.moving === '0' && Number(host.dataset.pins) + Number(host.dataset.clusters) > 0; });
  if (name === '04-swipe') await page.waitForFunction(() => {
    const host = document.querySelector('.shell-map .tmroot'), front = document.querySelector('.card.front');
    const features = JSON.parse(host?.dataset.features ?? '[]');
    return host?.dataset.moving === '0' && Number(host.dataset.zoom) >= 8 && features.length === 1 && features[0].id === front?.dataset.id;
  });
  await page.waitForTimeout(250);
  const overflow = await page.locator('#screen, [role="dialog"], .dbody, .place-list, [data-trip-form]').evaluateAll(elements => elements.filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1).map(element => ({ tag: element.className, width: element.clientWidth, scroll: element.scrollWidth })));
  assert.deepEqual(overflow, [], `Tràn ngang tại ${name}`);
  if (width > 767) {
    const overlap = await page.evaluate(() => {
      const create = document.querySelector('.map-create')?.getBoundingClientRect();
      const zoom = document.querySelector('.maplibregl-ctrl-group')?.getBoundingClientRect();
      return !!(create && zoom && create.width && zoom.width && create.left < zoom.right && create.right > zoom.left && create.top < zoom.bottom && create.bottom > zoom.top);
    });
    assert.equal(overlap, false, `Nút tạo chuyến không che zoom tại ${name}`);
  }
  if (name === '04-swipe') {
    const creditOnRight = await page.locator('.card.front .credit-btn').evaluate(button => {
      const card = button.closest('.card').getBoundingClientRect(), credit = button.getBoundingClientRect();
      return credit.left > card.left + card.width / 2 && credit.right <= card.right;
    });
    assert.equal(creditOnRight, true, 'Nguồn ảnh nằm đúng góc phải, không kế thừa position cũ');
  }
  await page.screenshot({ path: path.join(out, `${width}-${name}.png`) });
  return name;
}

/** Một người đã có danh tính nhưng chưa có chuyến: đi từ cảm hứng tới lịch thật, không gọi API để thay thao tác UI. */
async function journey(width) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, deviceScaleFactor: 1, hasTouch: width === 390, isMobile: width === 390, locale: 'vi-VN', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const steps = [];
  try {
    await page.goto(`${base}/?intro=0`);
    await seedIdentity(page);
    await page.locator('.home-hero-card .btn').waitFor();
    steps.push(await step(page, width, '01-home'));
    await page.locator('.home-hero-card .btn').click();
    await page.locator('[data-place-id="exp-cho-phien"]').waitFor();
    assert.match(await page.locator('[data-place-id="exp-cho-phien"] img').getAttribute('src'), /demo-people-29843930/);
    steps.push(await step(page, width, '02-destination'));
    await page.locator('.pl-filters').getByRole('button', { name: 'Món ăn', exact: true }).click();
    await page.locator('[data-place-id="exp-bua-sang"]').waitFor();
    await page.locator('[data-place-id="exp-bua-sang"] .pr-photo').click();
    const detail = page.getByRole('dialog', { name: 'Ăn sáng ở Đồng Văn', exact: true });
    await detail.waitFor();
    steps.push(await step(page, width, '03-food-detail'));
    await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.getByRole('button', { name: 'Chọn Ăn sáng ở Đồng Văn', exact: true }).click();
    await page.locator('.pl-filters').getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.evaluate(() => {
      const host = document.querySelector('.shell-map .tmroot');
      window.__wanderDeckZooms = [Number(host.dataset.zoom)];
      window.__wanderDeckObserver = new MutationObserver(() => { if (document.querySelector('.card.front')) window.__wanderDeckZooms.push(Number(host.dataset.zoom)); });
      window.__wanderDeckObserver.observe(host, { attributes: true, attributeFilter: ['data-zoom'] });
    });
    await page.getByRole('button', { name: 'Quẹt khám phá', exact: true }).click();
    await page.locator('.card.front[data-id="exp-cho-phien"]').waitFor();
    const image = page.locator('.card.front img.ph');
    const before = await image.getAttribute('src');
    await page.locator('.card.front').getByRole('button', { name: 'Ảnh sau', exact: true }).click();
    await page.waitForFunction(source => { const photo = document.querySelector('.card.front img.ph'); return photo?.getAttribute('src') !== source && photo?.dataset.imageReady === 'true'; }, before);
    assert.notEqual(await image.getAttribute('src'), before);
    steps.push(await step(page, width, '04-swipe'));
    const deckZooms = await page.evaluate(() => { window.__wanderDeckObserver.disconnect(); return window.__wanderDeckZooms; });
    assert.ok(deckZooms.length > 0 && Math.min(...deckZooms) >= 6, `Vào bộ quẹt không lóe về toàn quốc: ${deckZooms.join(',')}`);
    await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).click();
    await page.locator('.card.front[data-id="exp-ban-lang"]').waitFor();
    await page.locator('.round.l').click();
    await page.locator('.card.front[data-id="exp-khoang-dung"]').waitFor();
    await page.locator('.round.small').click();
    await page.locator('.card.front[data-id="exp-ban-lang"]').waitFor();
    await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).click();
    await page.getByRole('button', { name: 'Xem đã chọn (3)', exact: true }).click();
    await page.locator('.picked-row').first().waitFor();
    assert.equal(await page.locator('.picked-row').count(), 3);
    steps.push(await step(page, width, '05-picked'));
    await page.locator('.picked-create .btn').click();
    const form = page.getByRole('dialog').last();
    const name = `Hà Giang · trải nghiệm B ${width}`;
    await form.getByLabel('Tên chuyến đi', { exact: true }).fill(name);
    await form.locator('summary').click();
    const budget = form.getByLabel('Ngân sách, nghìn đồng (tùy chọn)', { exact: true });
    await budget.fill('-5');
    assert.equal(await budget.getAttribute('aria-invalid'), 'true');
    await budget.clear();
    await form.locator('summary').click();
    steps.push(await step(page, width, '06-create-form'));
    await form.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.waitForURL(/#\/trip\/[^/]+\/un$/);
    await page.locator('.unassigned-tab .itinerary-stop').first().waitFor();
    const stored = (await storedTrips(page)).trips.find(trip => trip.name === name);
    assert.ok(stored && stored.items.length === 3 && stored.items.every(item => item.day === null && item.placeId.startsWith('exp-')));
    steps.push(await step(page, width, '07-unassigned'));
    await page.locator('.unassigned-tab .itinerary-stop').first().getByRole('button', { name: 'Ngày 1', exact: true }).click();
    await page.getByRole('tab', { name: 'Lịch', exact: true }).click();
    await page.locator('.daysec .itinerary-stop').first().waitFor();
    steps.push(await step(page, width, '08-schedule'));
    await page.getByRole('button', { name: 'Chia sẻ lịch', exact: true }).click();
    await page.getByRole('dialog', { name: 'Chia sẻ chuyến đi', exact: true }).waitFor();
    steps.push(await step(page, width, '09-share'));
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.locator('#tabbar .tab').filter({ hasText: 'Đã chọn' }).click();
    await page.locator('.picked-row').first().waitFor();
    assert.equal(await page.locator('.picked-row').count(), 3, 'Lưu chuyến không làm mất bộ sưu tập');
    assert.deepEqual(errors, []);
    return { width, status: 'PASS', steps, createdTripId: stored.id, retained: 3 };
  } catch (error) {
    await page.screenshot({ path: path.join(out, `${width}-FAILED.png`) }).catch(() => {});
    const mapState = await page.evaluate(() => ({ ...document.querySelector('.shell-map .tmroot')?.dataset, zoomTrace: window.__wanderDeckZooms ?? [] })).catch(() => null);
    return { width, status: 'FAIL', steps, error: error.message, pageErrors: errors, mapState };
  } finally { await context.close(); }
}

try { for (const width of [390, 1440]) { const result = await journey(width); results.push(result); console.log(JSON.stringify(result)); } }
finally { await browser.close(); fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(results, null, 2)); }
process.exitCode = results.every(result => result.status === 'PASS') ? 0 : 1;
