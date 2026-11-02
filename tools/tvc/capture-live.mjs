import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { api, createOwner, loginAs } from '../../web/e2e/backend.ts';

/**
 * Chụp ba màn thật từ backend đang chạy ở cổng 8787 (cần `tools\dev.ps1 run`): thêm nhiều nơi, gợi ý quán gần, thẻ đánh giá.
 * Đánh giá và lời bình của "người dùng khác" được tạo bằng API cho mục đích minh họa, TVC ghi rõ là dữ liệu minh họa.
 */
const OUT = path.resolve('tools/tvc/assets');
fs.mkdirSync(OUT, { recursive: true });
const DAY = '2026-11-01';
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const newPage = async owner => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'vi-VN', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`${base}/#/`);
    await page.evaluate(() => { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); localStorage.setItem('wander.web.destination.v1', 'da-lat'); });
    await loginAs(page, owner.token);
    return page;
  };
  const settle = page => page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  const catalog = (await api('GET', '/api/catalog/destinations/da-lat', null)).body;
  const places = (catalog.destination ?? catalog).places;
  const byId = id => places.find(p => p.id === id);

  // 1. Thêm nhiều nơi: gõ tìm, tích nhiều nơi.
  const owner1 = await createOwner();
  const trip1 = (await api('POST', '/api/trips', owner1.token, { name: 'Đà Lạt 3 ngày', destination: 'da-lat', startDate: DAY, endDate: '2026-11-03' })).body.trip.id;
  const p1 = await newPage(owner1);
  await p1.goto(`${base}/#/trip/${trip1}/2`);
  await p1.getByRole('button', { name: 'Thêm nhiều nơi', exact: true }).click();
  const sheet1 = p1.getByRole('dialog', { name: 'Thêm nhiều nơi', exact: true });
  await sheet1.waitFor();
  await sheet1.getByRole('checkbox').nth(3).waitFor();
  for (const box of (await sheet1.getByRole('checkbox').all()).slice(0, 4)) await box.check();
  await settle(p1); await p1.waitForTimeout(900);
  await p1.screenshot({ path: path.join(OUT, 'search-many.png') });

  // 2. Gợi ý quán gần lịch ngày.
  const owner2 = await createOwner();
  const trip2 = (await api('POST', '/api/trips', owner2.token, { name: 'Gợi ý bữa Đà Lạt', destination: 'da-lat', startDate: '2026-10-31', endDate: DAY })).body.trip.id;
  for (const id of ['ho-xuan-huong', 'quang-truong-lam-vien', 'nha-tho-con-ga']) {
    await api('POST', `/api/trips/${trip2}/items`, owner2.token, { type: 'sightseeing', day: DAY, title: byId(id).name, placeId: id });
  }
  const p2 = await newPage(owner2);
  await p2.goto(`${base}/#/trip/${trip2}/2`);
  const reminder = p2.getByRole('complementary', { name: 'Chưa có bữa trưa' });
  await reminder.waitFor();
  await reminder.getByRole('button', { name: 'Thêm bữa trưa', exact: true }).click();
  await reminder.getByRole('button', { name: 'Gợi ý quán gần lịch ngày này', exact: true }).click();
  const sheet2 = p2.getByRole('dialog', { name: 'Gợi ý quán gần', exact: true });
  await sheet2.locator('.meal-poi').nth(2).waitFor();
  await settle(p2); await p2.waitForTimeout(900);
  await p2.screenshot({ path: path.join(OUT, 'meal.png') });

  // 3. Thẻ đánh giá của người dùng Wander.
  const raters = [await createOwner(), await createOwner(), await createOwner()];
  const notes = [[5, 'Sáng sớm ra hồ rất đẹp, nên đi sớm.'], [4, 'Chiều có gió, nhớ mang áo khoác.'], [5, '']];
  for (const [i, r] of raters.entries()) await api('PUT', '/api/places/ho-xuan-huong/rating', r.token, notes[i][1] ? { stars: notes[i][0], comment: notes[i][1] } : { stars: notes[i][0] });
  const viewer = await createOwner();
  const p3 = await newPage(viewer);
  await p3.goto(`${base}/#/deck/da-lat`);
  await p3.locator('.card.front img[data-image-ready="true"]').waitFor();
  await settle(p3); await p3.waitForTimeout(1800);
  await p3.getByRole('button', { name: 'Xem chi tiết' }).first().click({ force: true });
  const card = p3.locator('.rating-card');
  await card.waitFor();
  await card.scrollIntoViewIfNeeded();
  await card.evaluate(el => { const s = el.closest('.place-scroll'); if (s) s.scrollTop = el.offsetTop - 140; });
  await settle(p3); await p3.waitForTimeout(900);
  await p3.screenshot({ path: path.join(OUT, 'rating.png') });
  console.log('live screens saved');
} finally {
  await browser?.close(); await server.close();
}
