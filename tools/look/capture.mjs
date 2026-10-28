import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, '.logs/look-trial');
const CATALOG = path.join(ROOT, 'backend/src/main/resources/catalog');
const LOOKS = ['default', 'nunito', 'jakarta', 'lexend'];
const VIEWPORT = { width: 390, height: 844 };
const SETTLE_MS = 1400;
const CATEGORY = { canh: 'Cảnh quan', van: 'Văn hóa', am: 'Ẩm thực', leo: 'Leo núi', luu: 'Lưu trú', cho: 'Chợ' };
const VERDICT = { must: 'Nên ghé', worth: 'Đáng đi', ifconv: 'Chỉ ghé nếu tiện' };

/** Đọc catalog thật và chuyển các trường của kho JSON sang hợp đồng API dùng trong giao diện. */
function readCatalog() {
  return fs.readdirSync(CATALOG).filter((name) => name.endsWith('.json')).map((name) => {
    const d = JSON.parse(fs.readFileSync(path.join(CATALOG, name), 'utf8'));
    const places = d.places.map((p) => ({ ...p, categoryName: CATEGORY[p.category], verdictLabel: VERDICT[p.verdict], away: [], photos: p.photos.map((photo) => ({ ...photo, url: `/catalog/photos/${photo.file}` })) }));
    return { ...d, places, coverUrl: places.find((p) => p.id === d.coverPlaceId)?.photos[0]?.url, guide: d.guide.map((g) => ({ ...g, layout: g.layout.toLowerCase(), bestMonths: g.bestMonths ?? [], rainyMonths: g.rainyMonths ?? [], notes: g.notes ?? [], items: (g.items ?? []).map((i) => ({ text: '', placeId: null, ...i })) })) };
  });
}

/** Tóm tắt tọa độ từ các điểm có thật; không cần backend hoặc tile mạng. */
function summarize(d) {
  const points = d.places.filter((p) => p.lat != null && p.lon != null);
  return { ...d, lat: points.reduce((s, p) => s + p.lat, 0) / points.length, lon: points.reduce((s, p) => s + p.lon, 0) / points.length, placeCount: d.places.length, bestMonths: [], previews: [] };
}

const TRIP = { id: 'look-ha-giang', name: 'Hà Giang — những ngày nắng', destination: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-03', role: 'organizer', memberCount: 1, selfMemberId: 'look', kind: { code: 'friends', label: 'Bạn bè' }, interests: [], styles: [], pace: null, budgetK: 3000, createdAt: '2026-10-28T00:00:00Z' };

/** Chặn toàn bộ API bằng dữ liệu cục bộ; yêu cầu ngoài máy bị chặn để ảnh tái lập khi không có mạng. */
async function mockApi(page, catalog) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const p = url.pathname;
    let json;
    if (p.endsWith('/templates')) json = { templates: [] };
    else if (p === '/api/catalog/destinations') json = { destinations: catalog.map(summarize) };
    else if (p.startsWith('/api/catalog/destinations/')) json = { destination: catalog.find((d) => d.id === p.split('/').at(-1)) };
    else if (p === '/api/sessions') json = { sessions: [{ id: 'look', deviceName: 'Máy thử giao diện', current: true, lastSeenAt: '2026-10-28T00:00:00Z' }] };
    else if (p === '/api/events') json = { events: [], unseen: false };
    else if (p === '/api/recovery-code') json = { hasCode: true };
    else if (p === '/api/trips') json = { trips: [TRIP] };
    else if (p.endsWith('/trash')) json = { items: [] };
    else if (p === '/api/trips/look-ha-giang') json = { trip: TRIP, days: [], unscheduled: [] };
    else throw new Error(`API chưa giả lập: ${p}`);
    await route.fulfill({ json });
  });
}

/** Chụp một màn sau khi font và ảnh đã nạp; ghi số đo tràn ngang để hỗ trợ đánh giá thủ công. */
async function capture(page, base, look, screen, route, selector, detail = false) {
  await page.goto(`${base}?intro=0&look=${look === 'default' ? 'off' : look}#/${route}`);
  await page.locator(selector).first().waitFor();
  if (detail) {
    await page.locator('.round.small[aria-label="Xem chi tiết"]').click();
    await page.locator('.panel .gal').waitFor();
  }
  if (look !== 'default') await page.waitForFunction((value) => document.documentElement.dataset.look === value, look);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);
  if (look !== 'default') {
    const audit = await page.evaluate(() => {
      const button = document.querySelector('.iconbtn, .btn.ghost, .round.small');
      const style = button && getComputedStyle(button);
      return { background: style?.backgroundColor, color: style?.color, width: button?.getBoundingClientRect().width, height: button?.getBoundingClientRect().height,
        loadedFonts: [...document.fonts].filter((font) => font.status === 'loaded').map((font) => `${font.family} ${font.weight}`) };
    });
    assert.equal(audit.color, 'rgb(20, 33, 58)');
    assert.ok(audit.width >= 44 && audit.height >= 44);
    assert.ok(audit.loadedFonts.some((font) => font.includes('Nunito')));
    if (look === 'jakarta') assert.ok(audit.loadedFonts.some((font) => font.includes('Plus Jakarta Sans')));
    if (look === 'lexend') assert.ok(audit.loadedFonts.some((font) => font.includes('Lexend')));
    console.log(JSON.stringify({ look, screen, audit }));
  }
  await page.screenshot({ path: path.join(OUT, `${look}-${screen}.png`) });
  console.log(JSON.stringify({ look, screen, ...await page.evaluate(() => ({ font: getComputedStyle(document.body).fontFamily, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, trialRequests: performance.getEntriesByType('resource').filter((r) => r.name.includes('fonts-trial') || r.name.includes('/styles/look.css')).length })) }));
}

/** Ghép bốn ảnh nguyên kích thước bằng trình duyệt, nhãn đặt ngoài ảnh để PO dễ đối chiếu. */
async function compare(browser, screen) {
  const page = await browser.newPage({ viewport: { width: VIEWPORT.width * LOOKS.length, height: VIEWPORT.height + 40 } });
  await page.setContent(`<style>body{margin:0;display:flex}figure{margin:0}figcaption{height:40px;font:20px system-ui;display:grid;place-items:center}img{display:block}</style>${LOOKS.map((look) => `<figure><figcaption>${look}</figcaption><img width="390" height="844" src="data:image/png;base64,${fs.readFileSync(path.join(OUT, `${look}-${screen}.png`)).toString('base64')}"></figure>`).join('')}`);
  await page.screenshot({ path: path.join(OUT, `compare-${screen}.png`) });
  await page.close();
}

const server = await createServer({ root: path.join(ROOT, 'web'), configFile: path.join(ROOT, 'web/vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  fs.mkdirSync(OUT, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
  const base = server.resolvedUrls.local[0];
  const catalog = readCatalog();
  for (const look of LOOKS) {
    const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'light', locale: 'vi-VN', reducedMotion: 'reduce' });
    await context.addInitScript(() => { localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })); });
    const page = await context.newPage();
    page.on('pageerror', (error) => { throw error; });
    await mockApi(page, catalog);
    await capture(page, base, look, 'home', '', '.dcard');
    if (look === 'default') assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some((r) => r.name.includes('fonts-trial') || r.name.includes('/styles/look.css'))), false);
    await capture(page, base, look, 'destinations', 'destinations', '.destination-picker-list button');
    await capture(page, base, look, 'deck', 'deck/ha-giang', '.card.front');
    await capture(page, base, look, 'place', 'deck/ha-giang', '.card.front', true);
    await capture(page, base, look, 'trips', 'trips', '.tcard');
    await context.close();
  }
  for (const screen of ['home', 'destinations', 'deck', 'place', 'trips']) await compare(browser, screen);
  console.log('PASS: 20 ảnh + 5 ảnh ghép; API giả, catalog thật, tile ngoài mạng bị chặn.');
} finally {
  await browser?.close();
  await server.close();
}
