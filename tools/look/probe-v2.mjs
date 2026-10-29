import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { readCatalog } from './capture-fixtures.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, '.logs/look-real/v2');
const server = await createServer({ root: path.join(ROOT, 'web'), configFile: path.join(ROOT, 'web/vite.config.ts'), server: { port: 0 }, logLevel: 'silent' });
server.middlewares.use('/look-probe', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<html><body></body></html>'); });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 780, height: 390 } });
  const base = server.resolvedUrls.local[0];
  await page.goto(`${base}look-probe`);
  const urls = readCatalog().flatMap(d => d.places.flatMap(p => p.photos.map(i => i.url))).slice(0, 48);
  const samples = await page.evaluate(async urls => {
    const canvas = document.createElement('canvas'); canvas.width = 24; canvas.height = 24;
    const ctx = canvas.getContext('2d');
    const results = [];
    for (const url of urls) {
      const img = new Image(); img.src = url;
      try { await img.decode(); } catch { continue; }
      ctx.drawImage(img, 0, 0, 24, 24);
      const data = ctx.getImageData(0, 0, 24, 24).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722;
      results.push({ url, brightness: sum / (24 * 24) });
    }
    return results.sort((a, b) => a.brightness - b.brightness);
  }, urls);
  assert.ok(samples.length > 1);
  const chosen = [samples[0], samples.at(-1)];
  const icon = '<svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>';
  await page.setContent(`<link rel="stylesheet" href="${base}src/app/styles.css"><style>body{display:flex;gap:0;margin:0}section{width:390px;flex:none}h2{font:var(--text-body);padding:var(--s-3)}.dhero{height:280px;background-size:cover;background-position:center}.dhero::after{display:none}.probe-controls{position:absolute;inset:var(--s-4);display:flex;gap:var(--s-3);align-items:start}.probe-controls .chip{position:relative}.probe-controls .pill{margin-top:var(--s-8)}</style><main id="screen" style="display:contents">${chosen.map((p, i) => `<section><h2>${i ? 'Ảnh sáng' : 'Ảnh tối'} — ${p.brightness.toFixed(0)}/255</h2><div class="dhero" style="background-image:url('${base}${p.url.slice(1)}')"><div class="probe-controls"><button class="round">${icon}</button><button class="pill">Xem bản đồ</button><span class="chip glass">Nhãn trên ảnh</span></div></div></section>`).join('')}</main>`);
  await page.locator('.round').first().waitFor();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.round')).backdropFilter.includes('28px'));
  await page.evaluate(async urls => Promise.all(urls.map(url => { const i = new Image(); i.src = url; return i.decode(); })), chosen.map(p => `${base}${p.url.slice(1)}`));
  const checks = {};
  checks.photoLabel = await page.locator('.chip.glass').first().evaluate(e => ({ color: getComputedStyle(e).color, background: getComputedStyle(e).backgroundColor }));
  assert.equal(checks.photoLabel.color, 'rgb(255, 255, 255)');
  assert.equal(checks.photoLabel.background, 'rgba(7, 19, 38, 0.68)');
  await page.mouse.move(40, 95); await page.mouse.down(); await page.waitForTimeout(160);
  checks.press = await page.locator('.round').first().evaluate(e => ({ scale: getComputedStyle(e).scale, filter: getComputedStyle(e).filter }));
  assert.equal(checks.press.scale, '0.97');
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  checks.reducedMotion = await page.locator('.round').first().evaluate(e => getComputedStyle(e).transitionDuration);
  assert.ok(parseFloat(checks.reducedMotion) <= .001);
  await page.screenshot({ path: path.join(OUT, 'glass-photos.png') });
  fs.writeFileSync(path.join(OUT, 'glass-photos.json'), JSON.stringify({ chosen, checks }, null, 2));
  console.log('PASS kính 28px trên hai ảnh catalog sáng/tối; nh?n 0.97, reduced-motion t?c th?');
} finally { await browser?.close(); await server.close(); }
