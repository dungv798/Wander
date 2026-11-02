import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { api, createOwner, loginAs } from '../../web/e2e/backend.ts';

/** Chụp thêm màn "Thêm nhiều nơi" lúc CHƯA tích (để TVC làm động việc tích nhiều nơi). Cần backend ở cổng 8787. */
const OUT = path.resolve('tools/tvc/assets');
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const owner = await createOwner();
  const trip = (await api('POST', '/api/trips', owner.token, { name: 'Đà Lạt 3 ngày', destination: 'da-lat', startDate: '2026-11-01', endDate: '2026-11-03' })).body.trip.id;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'vi-VN', colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(`${base}/#/`);
  await page.evaluate(() => { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); localStorage.setItem('wander.web.destination.v1', 'da-lat'); });
  await loginAs(page, owner.token);
  await page.goto(`${base}/#/trip/${trip}/2`);
  await page.getByRole('button', { name: 'Thêm nhiều nơi', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Thêm nhiều nơi', exact: true });
  await sheet.waitFor();
  await sheet.getByRole('checkbox').nth(3).waitFor();
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'search-many-0.png') });
  const boxes = await sheet.getByRole('checkbox').all();
  await boxes[0].check(); await boxes[1].check();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'search-many-2.png') });
  console.log('extra saved');
} finally { await browser?.close(); await server.close(); }
