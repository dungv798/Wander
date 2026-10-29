import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { mockApi, readCatalog } from './capture-fixtures.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ROUND = process.argv[2] ?? '1';
const OUT = path.join(ROOT, '.logs/look-real', `v${ROUND}`);
const HEIGHT = 844;
const SCREENS = [
  { id: 'home', route: '', selector: '.dcard', sample: 'R03' },
  { id: 'destinations', route: 'destinations', selector: '.destination-picker-list button', sample: 'R06' },
  { id: 'deck', route: 'deck/ha-giang', selector: '.card.front', sample: 'R26' },
  { id: 'place', route: 'deck/ha-giang', selector: '.card.front', sample: 'R31', detail: true },
  { id: 'trips', route: 'trips', selector: '.tcard', sample: 'R08' },
];
const results = { command: `node tools/look/capture-real.mjs ${ROUND}`, errors: [], screens: [], comparisons: [] };

/** Đo font, ảnh và tràn chữ trên DOM thật; không coi scroll container có chủ ý là lỗi. */
async function audit(page) {
  return page.evaluate(() => {
    const icons = [...document.querySelectorAll('.fluent-icon')].map(e => {
      const r = e.getBoundingClientRect();
      const css = getComputedStyle(e);
      return { file: e.getAttribute('src'), width: parseFloat(css.width), height: parseFloat(css.height), renderedWidth: r.width, renderedHeight: r.height, loaded: e.complete && e.naturalWidth > 0 };
    });
    const textOverflow = [...document.querySelectorAll('h1,h2,h3,h4,.facts b,.tcard .meta,.thead .note,.tab')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && r.bottom > 0 && r.top < innerHeight && e.scrollWidth > e.clientWidth + 2;
    }).map(e => ({ tag: e.tagName, class: e.className, text: e.textContent.slice(0, 70) }));
    return { font: getComputedStyle(document.body).fontFamily, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight}`),
      fontRequests: performance.getEntriesByType('resource').filter(r => /\/fonts\//.test(r.name)).map(r => r.name.split('/').at(-1)),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, textOverflow, icons,
      glass: [...document.querySelectorAll('#tabbar,.search,.iconbtn,.panel,.sheetbody,.filters .fchip')].slice(0, 12).map(e => ({ class: e.className, filter: getComputedStyle(e).backdropFilter, background: getComputedStyle(e).backgroundColor })) };
  });
}

/** Mở màn thật với API giả, đợi font/ảnh; không khởi chạy backend hay bộ E2E. */
async function capture(page, base, look, width, screen) {
  await page.goto(`${base}?intro=0${look === 'classic' ? '&look=classic' : ''}#/${screen.route}`);
  await page.locator(screen.selector).first().waitFor();
  if (screen.detail) {
    await page.locator('.round.small[aria-label="Xem chi tiết"]').click();
    await page.locator('.panel .gal').waitFor();
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = [...document.images].filter(i => {
      const r = i.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0;
    });
    visible.forEach(i => { i.loading = 'eager'; });
    await Promise.all(visible.map(i => i.decode().catch(() => {})));
  });
  await page.waitForTimeout(700);
  const measured = await audit(page);
  assert.equal(measured.horizontalOverflow, false);
  if (look === 'new') {
    assert.ok(measured.fonts.some(f => f.startsWith('Nunito')));
    assert.ok(!measured.fontRequests.some(f => /Baloo|BeVietnam/.test(f)));
    assert.ok(measured.icons.every(i => i.loaded && i.width >= 24 && i.width <= 40 && i.height >= 24 && i.height <= 40), JSON.stringify(measured.icons));
  } else {
    assert.ok(measured.fonts.some(f => f.includes('Be Vietnam Pro')));
    assert.ok(!measured.fontRequests.some(f => /Baloo/.test(f)));
    assert.equal(measured.icons.length, 0);
  }
  const file = `${look}-${width}-${screen.id}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  results.screens.push({ look, width, screen: screen.id, file, ...measured });
  if (screen.detail) {
    const next = page.locator('.gal .gnav.next');
    if (await next.count()) {
      await next.click();
      await page.waitForFunction(() => document.querySelector('.gcount')?.textContent?.startsWith('2 /'));
      await page.locator('.gallery').focus();
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => document.querySelector('.gcount')?.textContent?.startsWith('1 /'));
      results.screens.at(-1).galleryNavigation = 'PASS: nút tiếp và phím trái';
    }
  }
  if (process.env.LOOK_EXTENDED === '1' && width === 390 && look === 'new') {
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.screenshot({ path: path.join(OUT, `text200-${screen.id}.png`) });
    results.screens.push({ look, width, screen: screen.id, zoom: 'text 200%', ...await audit(page) });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.documentElement.style.zoom = '2'; });
    await page.screenshot({ path: path.join(OUT, `zoom200-${screen.id}.png`) });
    results.screens.push({ look, width, screen: screen.id, zoom: 'CSS zoom 200% (reflow)', ...await audit(page) });
  }
}

/** Ghép crop mẫu, look mới và classic đúng chiều rộng; ghi rõ màn không có mẫu tương đương. */
async function compare(browser, screen) {
  const page = await browser.newPage({ viewport: { width: 1170, height: 884 } });
  const files = [path.join(ROOT, `docs/design/crops/${screen.sample}-full.png`), path.join(OUT, `new-390-${screen.id}.png`), path.join(OUT, `classic-390-${screen.id}.png`)];
  const labels = [`${screen.sample}${screen.id === 'deck' ? ' — chỉ tham chiếu, không có màn quẹt mẫu' : ''}`, 'Wander mặc định', 'Wander classic'];
  await page.setContent(`<style>body{margin:0;display:flex}figure{margin:0;width:390px}figcaption{height:40px;font:14px system-ui;display:grid;place-items:center}img{display:block;width:390px}</style>${files.map((file, i) => `<figure><figcaption>${labels[i]}</figcaption><img src="data:image/png;base64,${fs.readFileSync(file).toString('base64')}"></figure>`).join('')}`);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  await page.screenshot({ path: path.join(OUT, `compare-${screen.id}.png`) });
  results.comparisons.push(`compare-${screen.id}.png`);
  await page.close();
}

const server = await createServer({ root: path.join(ROOT, 'web'), configFile: path.join(ROOT, 'web/vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  fs.mkdirSync(OUT, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  results.browser = browser.version();
  const base = server.resolvedUrls.local[0];
  const catalog = readCatalog();
  for (const width of [390]) for (const look of ['new', 'classic']) {
    const context = await browser.newContext({ viewport: { width, height: HEIGHT }, colorScheme: 'light', locale: 'vi-VN', reducedMotion: 'reduce' });
    await context.addInitScript(() => { localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })); });
    const page = await context.newPage();
    page.on('pageerror', e => results.errors.push(e.message));
    await mockApi(page, catalog);
    for (const screen of SCREENS) await capture(page, base, look, width, screen);
    await context.close();
  }
  for (const screen of SCREENS) await compare(browser, screen);
  assert.equal(results.errors.length, 0);
  console.log(`PASS: ${results.screens.length} màn, ${results.comparisons.length} ảnh đối chiếu; ${results.errors.length} pageerror.`);
} finally {
  fs.writeFileSync(path.join(OUT, 'capture.json'), JSON.stringify(results, null, 2));
  await browser?.close();
  await server.close();
}
