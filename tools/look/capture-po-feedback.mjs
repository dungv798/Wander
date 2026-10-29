import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { mockApi, readCatalog } from './capture-fixtures.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PHASE = process.argv[2] ?? 'before';
const OUT = path.join(ROOT, '.logs/look-real/po-feedback', PHASE);
const SCREENS = [
  ['home', '', '.dcard'],
  ['destinations', 'destinations', '.destination-picker-list button'],
  ['destination', 'dest/ha-giang', '.dhero'],
  ['map-place', 'dest/ha-giang', '.mapcard'],
  ['trips', 'trips', '.tcard'],
  ['trip', 'trip/look-ha-giang/ov', '.thead'],
];
const result = { phase: PHASE, errors: [], screens: [], checks: [] };

/** Đếm ảnh giao với cửa sổ gallery; ảnh nằm ngoài vùng cuộn không được tính. */
async function galleryState(page) {
  return page.locator('.gallery').evaluate(g => {
    const box = g.getBoundingClientRect();
    return { count: [...g.querySelectorAll('img')].filter(img => {
      const r = img.getBoundingClientRect();
      return Math.min(r.right, box.right) - Math.max(r.left, box.left) > 1;
    }).length, width: box.width, height: box.height, label: document.querySelector('.gcount')?.textContent };
  });
}

/** Mở ghim bằng nút truy cập của bản đồ; tái lập được khi tile ngoài máy bị chặn. */
async function openMapPlace(page, placeId) {
  const map = page.locator('.mapcard');
  await map.scrollIntoViewIfNeeded();
  const pin = placeId ? map.locator(`.tm-accessible button[data-id="${placeId}"]`) : map.locator('.tm-accessible button').first();
  await pin.focus();
  const id = await pin.getAttribute('data-id');
  await pin.press('Enter');
  await page.locator('.panel .gallery').waitFor();
  return id;
}

const server = await createServer({ root: path.join(ROOT, 'web'), configFile: path.join(ROOT, 'web/vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  fs.mkdirSync(OUT, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN', colorScheme: 'light', reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })));
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  await mockApi(page, readCatalog());
  // Nền GL rỗng cục bộ: kiểm callback ghim thật, không đánh giá style bản đồ của job khác.
  await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background' }] } }));
  for (const [id, route, selector] of SCREENS) {
    await page.goto(`${server.resolvedUrls.local[0]}?intro=0#/${route}`);
    await page.locator(selector).first().waitFor();
    const entry = { id };
    if (id === 'map-place') entry.pin = await openMapPlace(page);
    await page.evaluate(async () => {
      await document.fonts.ready;
      const visible = [...document.images].filter(i => {
        const r = i.getBoundingClientRect();
        return r.width && r.height && r.top < innerHeight && r.bottom > 0;
      });
      visible.forEach(i => { i.loading = 'eager'; });
      await Promise.all(visible.map(i => i.decode().catch(() => {})));
    });
    await page.waitForTimeout(500);
    entry.layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, scrollHeight: document.querySelector('#screen').scrollHeight }));
    entry.controls = await page.locator('.btn,.round,.pill,.fchip,.dtab,.iconbtn,.gnav,#tabbar').evaluateAll(elements => elements.map(e => ({ class: e.className, background: getComputedStyle(e).backgroundColor, image: getComputedStyle(e).backgroundImage, blur: getComputedStyle(e).backdropFilter, color: getComputedStyle(e).color })));
    if (PHASE === 'after' && id === 'home') {
      assert.ok(await page.evaluate(() => document.querySelector('.fan').getBoundingClientRect().top > document.querySelector('.tagline').getBoundingClientRect().bottom), 'quạt ảnh nằm dưới logo và câu mời');
    }
    if (id === 'map-place') {
      entry.gallery = await galleryState(page);
      if (PHASE === 'after') {
        assert.equal(entry.gallery.count, 1);
        await page.locator('.gnav.next').click();
        await page.waitForFunction(() => document.querySelector('.gcount')?.textContent.startsWith('2 /'));
        assert.equal((await galleryState(page)).count, 1);
        await page.locator('.gnav.prev').click();
        await page.waitForFunction(() => document.querySelector('.gcount')?.textContent.startsWith('1 /'));
      }
    }
    await page.screenshot({ path: path.join(OUT, `${id}.png`) });
    result.screens.push(entry);
  }
  if (PHASE === 'after') await verifyOtherEntries(page, server.resolvedUrls.local[0]);
  assert.deepEqual(result.errors, []);
  console.log(`PASS ${PHASE}: ${result.screens.length} màn 390x844; ${result.errors.length} pageerror`);
} finally {
  fs.writeFileSync(path.join(OUT, 'capture.json'), JSON.stringify(result, null, 2));
  await browser?.close();
  await server.close();
}

/** Kiểm thêm lối bộ thẻ/Đà Lạt, đổi cỡ, Đã chọn và từng tab; không chạy bộ e2e. */
async function verifyOtherEntries(page, base) {
  await page.goto(`${base}?intro=0#/dest/da-lat`);
  await page.locator('.mapcard').waitFor();
  await openMapPlace(page, 'lang-biang');
  assert.equal((await galleryState(page)).count, 1);
  await page.locator('.gnav.next').click();
  await page.waitForFunction(() => document.querySelector('.gcount')?.textContent.startsWith('2 /'));
  assert.equal((await galleryState(page)).count, 1);
  result.checks.push('Lang Biang: mở từ ghim truy cập bản đồ, next, một ảnh');
  await page.goto(`${base}?intro=0#/deck/ha-giang`);
  await page.locator('.round.small[aria-label="Xem chi tiết"]').click();
  await page.locator('.panel .gallery').waitFor();
  assert.equal((await galleryState(page)).count, 1);
  await page.locator('.gnav.next').click();
  await page.waitForFunction(() => document.querySelector('.gcount')?.textContent.startsWith('2 /'));
  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForTimeout(300);
  assert.equal((await galleryState(page)).count, 1);
  assert.ok((await galleryState(page)).label.startsWith('2 /'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  assert.equal((await galleryState(page)).count, 1);
  result.checks.push('Bộ thẻ: một ảnh, next, đổi cỡ giữ ảnh thứ hai');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chọn nơi này' }).click();
  await page.goto(`${base}?intro=0#/picked`);
  await page.locator('.tile').waitFor();
  result.checks.push({ picked: await page.locator('.tile').first().evaluate(e => ({ width: e.clientWidth, height: e.clientHeight })) });
  for (const tab of ['ov', '1', '2', '3']) {
    await page.goto(`${base}?intro=0#/trip/look-ha-giang/${tab}`);
    await page.locator('[role="tabpanel"]').waitFor();
    assert.ok(await page.locator('.g-primary').count() <= 1, 'tối đa một CTA màu trong tab');
    result.checks.push({ tab, spacing: await page.locator('.tbody').evaluate(e => ({ gap: getComputedStyle(e).gap, paddingTop: getComputedStyle(e).paddingTop })) });
  }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches), true);
  assert.equal(await page.locator('.dtab').first().evaluate(e => getComputedStyle(e).backdropFilter), 'none');
  result.checks.push('prefers-reduced-transparency: blur none');
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  // Bỏ nhánh nâng cấp @supports để đo đúng các khai báo fallback, không giả là đã chạy engine cũ.
  await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        const rule = sheet.cssRules[i];
        if (rule instanceof CSSSupportsRule && rule.conditionText.includes('backdrop-filter')) sheet.deleteRule(i);
      }
    }
  });
  assert.equal(await page.locator('.dtab').first().evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(255, 251, 237)');
  result.checks.push('Fallback: bỏ nhánh @supports, nền đặc đúng token');
}
