import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { mockApi, readCatalog } from './capture-fixtures.mjs';

const phase = process.argv[2] ?? 'after';
const out = path.resolve('.logs/ux-buttons', phase);
fs.mkdirSync(out, { recursive: true });
const screens = { home: '/', destinations: '/destinations', destination: '/dest/ha-giang', deck: '/deck/ha-giang', picked: '/picked', trips: '/trips', trip: '/trip/look-ha-giang/1', settings: '/settings' };
const result = { phase, screens: [], failures: [], errors: [], contrast: [] };
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [name, hash] of Object.entries(screens)) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('wander.web.destination.v1', 'ha-giang');
      localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
      localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));
    });
    const page = await context.newPage();
    page.on('pageerror', e => result.errors.push({ name, error: e.message }));
    await mockApi(page, readCatalog());
    await page.route('**/api/preferences', route => route.fulfill({ json: { interests: [], styles: [], pace: null, budgetK: null } }));
    await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#8fd3fb' } }] } }));
    await page.goto(`${server.resolvedUrls.local[0]}?intro=0#${hash}`);
    await page.waitForTimeout(900);
    await page.evaluate(() => document.fonts.ready);
    const entry = { name, controls: await scan(page) };
    if (Object.keys(screens).indexOf(name) < 6) await page.screenshot({ path: path.join(out, `${name}.png`) });
    if (name === 'trip') {
      const row = page.locator('button.irow').first();
      if (await row.count()) {
        await row.click();
        const edit = page.getByRole('button', { name: 'Giờ, chi phí, đặt chỗ', exact: true }).first();
        if (await edit.count()) await edit.click();
      }
      entry.openButtons = await page.locator('.panel button').allTextContents();
      entry.overlay = await scan(page);
      await page.screenshot({ path: path.join(out, 'trip-overlay.png') });
      const booked = page.getByRole('button', { name: 'Đã đặt', exact: true });
      if (await booked.count()) {
        const pending = page.getByRole('button', { name: 'Chờ xác nhận', exact: true });
        entry.bookingBefore = [await pending.boundingBox(), await booked.boundingBox()];
        await booked.click();
        entry.bookingAfter = [await pending.boundingBox(), await booked.boundingBox()];
        entry.bookingSelected = await booked.getAttribute('aria-pressed');
        await page.screenshot({ path: path.join(out, 'booking-selected.png') });
        if (phase === 'after' && entry.bookingBefore.some((box, i) => Math.abs(box.width - entry.bookingAfter[i].width) > .5 || Math.abs(box.height - entry.bookingAfter[i].height) > .5)) result.failures.push({ screen: name, issue: 'booking-resize' });
        entry.bookingContrast = phase === 'after' ? await pixelContrast(page) : [];
        await page.route('**/api/trips/look-ha-giang/items/look-item-0', route => route.request().method() === 'DELETE' ? route.fulfill({ status: 204 }) : route.fallback());
        await page.getByRole('button', { name: 'Xóa khỏi chuyến đi', exact: true }).click();
        await page.locator('.toast button').waitFor();
        entry.toast = await scan(page);
        entry.toastContrast = phase === 'after' ? await pixelContrast(page) : [];
        await page.screenshot({ path: path.join(out, 'toast-undo.png') });
      }
    }
    if (name === 'deck') {
      // Quẹt một lần để bật nút Hoàn tác thật, sau đó kiểm toast từ flow thật.
      await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).click();
      entry.undo = await scan(page);
    }
    if (phase === 'after') result.contrast.push({ name, samples: await pixelContrast(page) });
    result.screens.push(entry);
    await context.close();
  }
  for (const screen of result.screens) for (const control of [...screen.controls, ...(screen.overlay ?? []), ...(screen.toast ?? []), ...(screen.undo ?? [])]) {
    for (const issue of control.issues) result.failures.push({ screen: screen.name, label: control.label, class: control.class, issue });
  }
  for (const screen of result.screens) {
    if (screen.bookingContrast?.length) result.contrast.push({ name: `${screen.name}-booking`, samples: screen.bookingContrast });
    if (screen.toastContrast?.length) result.contrast.push({ name: `${screen.name}-toast`, samples: screen.toastContrast });
  }
  for (const screen of result.contrast) for (const sample of screen.samples) if (sample.ratio < sample.threshold) result.failures.push({ screen: screen.name, label: sample.label, issue: `pixel-contrast:${sample.ratio.toFixed(2)}`, kind: sample.kind });
} finally {
  fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(result, null, 2));
  await browser?.close(); await server.close();
}
console.log(`${result.failures.length ? 'FAIL' : 'PASS'} ${phase}: ${result.screens.length} màn; ${result.failures.length} lỗi; ${result.errors.length} pageerror; ${out}`);
if (phase === 'after' && (result.failures.length || result.errors.length)) process.exitCode = 1;

/** Quét cả điều khiển ngoài viewport; ghép alpha theo cây nền, báo riêng vùng ảnh chưa đo pixel. */
async function scan(page) {
  return page.evaluate(() => {
    const rgba = value => (value.match(/[\d.]+/g) ?? []).map(Number);
    const blend = (fg, bg) => fg.slice(0, 3).map((c, i) => c * (fg[3] ?? 1) + bg[i] * (1 - (fg[3] ?? 1)));
    const luma = rgb => rgb.reduce((s, c, i) => { const v = c / 255; return s + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i]; }, 0);
    const ratio = (a, b) => (Math.max(luma(a), luma(b)) + .05) / (Math.min(luma(a), luma(b)) + .05);
    return [...document.querySelectorAll('button, a[href], [role="button"], .chip, .mchip')].filter(el => el.getBoundingClientRect().height && getComputedStyle(el).visibility !== 'hidden').map(el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      const issues = [];
      const prose = el.matches('p a, li a') && !el.className;
      if (!prose && s.textDecorationLine.includes('underline')) issues.push('underline');
      if (el.matches('button, a[role="button"]') && !el.closest('.tm-accessible') && (r.height < 44 || r.width < 44)) issues.push('tap-target');
      const bottom = rgba(s.borderBottomColor);
      if (parseFloat(s.borderBottomWidth) && (bottom[3] ?? 1) > .5 && Math.max(...bottom.slice(0, 3)) < 65 && (s.borderBottomColor !== s.borderTopColor || s.borderBottomWidth !== s.borderTopWidth)) issues.push('black-bottom');
      let bg = [255, 255, 255], image = false;
      const chain = []; for (let p = el; p; p = p.parentElement) chain.unshift(p);
      for (const p of chain) { const c = getComputedStyle(p); bg = blend(rgba(c.backgroundColor), bg); image ||= c.backgroundImage !== 'none'; }
      const contrast = ratio(rgba(s.color), bg);
      if (!image && el.textContent.trim() && !el.matches(':disabled') && contrast < 4.5) issues.push(`contrast:${contrast.toFixed(2)}`);
      const old = el.getAttribute('aria-pressed') ?? el.getAttribute('aria-selected');
      let delta = null;
      if (old !== null) {
        const attr = el.hasAttribute('aria-pressed') ? 'aria-pressed' : 'aria-selected';
        el.setAttribute(attr, old === 'true' ? 'false' : 'true');
        const next = el.getBoundingClientRect(); delta = { width: next.width - r.width, height: next.height - r.height };
        el.setAttribute(attr, old);
        if (Math.abs(delta.height) > .5 || Math.abs(delta.width) > .5) issues.push('selection-resize');
      }
      return { label: (el.getAttribute('aria-label') ?? el.textContent.trim()).slice(0, 90), class: el.className, background: s.backgroundColor, border: s.border, shadow: s.boxShadow, decoration: s.textDecorationLine, width: r.width, height: r.height, contrast: image ? 'IMAGE_REQUIRES_PIXEL' : contrast, delta, issues };
    });
  });
}

/** Đo nền render thật dưới vùng chữ/icon nhìn thấy; giữ nguyên scrim, gradient và backdrop-filter. */
async function pixelContrast(page) {
  const boxes = await page.evaluate(() => {
    const boxes = [];
    for (const el of document.querySelectorAll('button, a[href], .chip, .mchip')) {
      if (el.matches(':disabled') || el.closest('.tm-accessible')) continue;
      const label = (el.getAttribute('aria-label') ?? el.textContent.trim()).slice(0, 60);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const p = node.parentElement, style = getComputedStyle(p);
        if (style.visibility !== 'visible' || +style.opacity === 0) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          const center = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          if (r.width < 2 || r.height < 2 || r.x < 0 || r.y < 0 || r.right > innerWidth || r.bottom > innerHeight || !el.contains(center)) continue;
          boxes.push({ label, kind: 'text', color: style.color, x: r.x + 2, y: r.y + 2, w: Math.max(1, r.width - 4), h: Math.max(1, r.height - 4), threshold: 4.5 });
        }
      }
      for (const svg of el.querySelectorAll('svg')) {
        const r = svg.getBoundingClientRect(), style = getComputedStyle(svg);
        const center = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        if (!el.contains(center) || r.x < 0 || r.y < 0 || r.right > innerWidth || r.bottom > innerHeight || !r.height || style.visibility !== 'visible' || +getComputedStyle(svg.parentElement).opacity === 0) continue;
        boxes.push({ label, kind: 'icon', color: style.color, x: r.x + r.width / 4, y: r.y + r.height / 4, w: r.width / 2, h: r.height / 2, threshold: 3 });
      }
    }
    return boxes;
  });
  const style = await page.addStyleTag({ content: 'button, button *, a[href], a[href] *, .chip, .chip *, .mchip, .mchip * { color: transparent !important; text-shadow: none !important; stroke: transparent !important; fill: transparent !important; }' });
  const shot = await page.screenshot();
  await style.evaluate(el => el.remove());
  return page.evaluate(async ({ data, boxes }) => {
    const img = new Image(); img.src = data; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
    const luma = rgb => rgb.reduce((s, c, i) => { const v = c / 255; return s + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i]; }, 0);
    return boxes.map(b => {
      const fg = luma(b.color.match(/[\d.]+/g).slice(0, 3).map(Number));
      const pixels = ctx.getImageData(Math.ceil(b.x), Math.ceil(b.y), Math.max(1, Math.floor(b.w)), Math.max(1, Math.floor(b.h))).data;
      let minimum = Infinity;
      for (let i = 0; i < pixels.length; i += 4) { const bg = luma([...pixels.slice(i, i + 3)]); minimum = Math.min(minimum, (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05)); }
      return { label: b.label, kind: b.kind, threshold: b.threshold, ratio: minimum };
    });
  }, { data: `data:image/png;base64,${shot.toString('base64')}`, boxes });
}
