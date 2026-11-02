import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { seed, mockJourney } from '../video/journey-fixtures.mjs';

/**
 * Chụp màn hình THẬT của app ở 390×844 (điện thoại thật) với độ phân giải 3× và tile bản đồ thật (cần mạng),
 * làm nguyên liệu cho TVC. Không vẽ lại giao diện: mỗi ảnh là một khung hình của app đang chạy.
 */
const OUT = path.resolve('tools/tvc/assets');
fs.mkdirSync(OUT, { recursive: true });
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'vi-VN', colorScheme: 'light', reducedMotion: 'no-preference' });
  await seed(context);
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), type: 'png' });
  const settle = page => page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });

  // Bộ thẻ: thẻ 1, thẻ đang bị kéo sang phải (dấu ✓ hiện), rồi thẻ 2 sau khi chọn.
  const deck = await context.newPage();
  await mockJourney(deck, true);
  await deck.goto(`${base}?intro=0#/deck/da-lat`);
  await deck.locator('.card.front img[data-image-ready="true"]').waitFor();
  await settle(deck);
  await deck.waitForTimeout(600);
  await shot(deck, 'deck-1.png');
  const box = await deck.locator('.card.front').boundingBox();
  await deck.mouse.move(box.x + box.width * .3, box.y + box.height * .5);
  await deck.mouse.down();
  await deck.mouse.move(box.x + box.width * .3 + 150, box.y + box.height * .5 - 20, { steps: 10 });
  await deck.waitForTimeout(250);
  await shot(deck, 'deck-swipe.png');
  await deck.mouse.move(380, box.y + box.height * .45, { steps: 8 });
  await deck.mouse.up();
  await deck.getByRole('button', { name: 'Xem đã chọn (1)', exact: true }).waitFor();
  await deck.locator('.card.front img[data-image-ready="true"]').waitFor();
  await settle(deck);
  await deck.waitForTimeout(900);
  await shot(deck, 'deck-2.png');

  // Bản đồ chuyến: tổng quan rồi Ngày 1 (tuyến đã vẽ xong).
  const map = await context.newPage();
  await mockJourney(map, true);
  await map.goto(`${base}?intro=0#/trip/journey/ov`);
  await map.locator('.tmap[data-ready="1"]').waitFor();
  await map.waitForFunction(() => JSON.parse(document.querySelector('.tmap').dataset.features).length >= 4);
  await map.waitForFunction(() => Number(document.querySelector('.tmap').dataset.renderedImages) >= 5);
  await map.addStyleTag({ content: '.tm-seg-label { visibility: hidden !important }' });
  await settle(map);
  await map.waitForTimeout(3500);
  await shot(map, 'map-overview.png');
  await map.getByRole('tab', { name: 'Ngày 1', exact: true }).click();
  await map.waitForTimeout(2500);
  await shot(map, 'map-day1.png');
  console.log('screens saved to', OUT);
} finally {
  await browser?.close(); await server.close();
}
