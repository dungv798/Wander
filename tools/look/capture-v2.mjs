import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { mockApi, readCatalog } from './capture-fixtures.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PHASE = process.argv[2] ?? 'before';
const OUT = path.join(ROOT, '.logs/look-real/v2', PHASE);
const SCREENS = [['home', '', '.home-hero, .dcard'], ['destinations', 'destinations', '.destination-picker-list button'], ['deck', 'deck/ha-giang', '.card'], ['detail', 'deck/ha-giang', '.card'], ['trips', 'trips', '.tcard'], ['picked', 'picked', '.tile']];
const result = { phase: PHASE, errors: [], screens: [], checks: [] };
const server = await createServer({ root: path.join(ROOT, 'web'), configFile: path.join(ROOT, 'web/vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
let browser;

/** Đợi phông và ảnh hiện trong khung nhìn trước khi chụp mốc so sánh. */
async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); }));
  });
  await page.waitForTimeout(500);
}

try {
  fs.mkdirSync(OUT, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN', colorScheme: 'light', reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })));
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  const catalog = readCatalog();
  await mockApi(page, catalog);
  await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background' }] } }));
  const base = server.resolvedUrls.local[0];
  // Chọn thật qua giao diện để màn Đã chọn có dữ liệu, không phụ thuộc khóa lưu nội bộ.
  await page.goto(`${base}?intro=0#/deck/ha-giang`);
  await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).click();
  for (const [id, route, selector] of SCREENS) {
    await page.goto(`${base}?intro=0#/${route}`);
    await page.locator(selector).first().waitFor();
    if (id === 'detail') {
      await page.locator('.round.small[aria-label="Xem chi tiết"]').click();
      await page.locator('.panel .gallery').waitFor();
    }
    await ready(page);
    const entry = { id, ...await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, bg: getComputedStyle(document.body).backgroundColor })) };
    assert.equal(entry.overflow, false, id);
    await page.screenshot({ path: path.join(OUT, `${id}.png`) });
    result.screens.push(entry);
  }
  if (PHASE === 'after') {
    await page.goto(`${base}?intro=0#/trip/look-ha-giang/ov`);
    await page.locator('.dtab').first().waitFor();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    assert.equal(await page.locator('.dtab').first().evaluate(e => getComputedStyle(e).backdropFilter), 'none');
    result.checks.push('Giảm độ trong: backdrop-filter none');
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    await page.evaluate(() => { for (const sheet of document.styleSheets) for (let i = sheet.cssRules.length - 1; i >= 0; i--) { const rule = sheet.cssRules[i]; if (rule instanceof CSSSupportsRule && rule.conditionText.includes('backdrop-filter')) sheet.deleteRule(i); } });
    const fallback = await page.locator('.dtab').last().evaluate(e => ({ actual: getComputedStyle(e).backgroundColor, expected: getComputedStyle(document.documentElement).getPropertyValue('--glass-fallback').trim() }));
    assert.ok(fallback.actual !== 'rgba(0, 0, 0, 0)');
    result.checks.push({ fallback });
    await page.goto(`${base}?intro=0&look=classic#/`);
    await page.locator('.home-hero, .dcard').first().waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.look), 'classic');
    assert.equal(await page.locator('#tabbar').evaluate(e => getComputedStyle(e).backdropFilter), 'none');
    result.checks.push('Classic: route chạy, blur none');
  }
  assert.deepEqual(result.errors, []);
  console.log(`PASS ${PHASE}: 6 màn 390x844, không tràn ngang, không pageerror`);
} finally {
  fs.writeFileSync(path.join(OUT, 'capture.json'), JSON.stringify(result, null, 2));
  await browser?.close();
  await server.close();
}
