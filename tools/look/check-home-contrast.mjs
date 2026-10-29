import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { mockApi, readCatalog } from './capture-fixtures.mjs';

const analysis = JSON.parse(fs.readFileSync('.logs/look-real/hero/analysis.json', 'utf8'));
const selected = analysis.rows.filter(r => analysis.selection[r.destination].includes(r.file)).sort((a, b) => a.brightness - b.brightness);
const extremes = [selected[0], selected.at(-1)];
// Phạm vi hero chỉ đo ảnh thật; phép quét nền bỏ bóng chữ không chứng minh được halo của nhãn kính.
const heroOnly = process.argv.includes('--hero-only');
const outputDir = '.logs/home-v3/fix';
fs.mkdirSync(outputDir, { recursive: true });
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  await server.listen();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
    localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'look_mock_only_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));
  });
  const page = await ctx.newPage();
  await mockApi(page, readCatalog());
  await page.goto(`${server.resolvedUrls.local[0]}?intro=0#/`);
  await page.locator('.home-hero h1').waitFor();
  await page.evaluate(async () => { await document.fonts.ready; });
  for (const item of heroOnly ? extremes : [...extremes, { file: 'white' }, { file: 'black' }]) {
    await page.evaluate(async file => {
      const img = document.querySelector('.home-hero img.is-active');
      if (file === 'white' || file === 'black') {
        img.style.visibility = 'hidden';
        document.querySelector('.home-hero-photos').style.background = file;
      } else { img.src = `/catalog/photos/${file}`; await img.decode(); }
      // Đặt cùng vật liệu thanh tab trên ảnh hoặc nền trắng để kiểm nền thực sự phía sau kính.
      const tab = document.querySelector('#tabbar');
      tab.style.top = '140px'; tab.style.bottom = 'auto';
    }, item.file);
    const boxes = await page.evaluate(() => {
      const selectors = ['.home-hero h1', '.home-hero-tagline', '.home-hero-brand', '.home-hero .search span', '#tabbar .tab span:not(.dot)'];
      return selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(el => {
        const rect = el.getBoundingClientRect(), color = getComputedStyle(el).color;
        el.style.color = 'transparent'; el.style.textShadow = 'none';
        return { selector, x: rect.x, y: rect.y, width: rect.width, height: rect.height, color };
      }));
    });
    await page.addStyleTag({ content: '#tabbar svg, .home-hero .search svg { visibility: hidden; }' });
    const shot = await page.screenshot();
    const ratios = await page.evaluate(async ({ data, boxes }) => {
      const img = new Image(); img.src = data; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const luma = rgb => rgb.reduce((sum, c, i) => { const v = c / 255; return sum + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i]; }, 0);
      return boxes.map(box => {
        const fg = luma(box.color.match(/[\d.]+/g).slice(0, 3).map(Number));
        let minimum = Infinity;
        // Bỏ góc bo của nhãn; quét vùng nét chữ có thể nằm, không dùng trung bình che pixel sáng.
        const pixels = ctx.getImageData(Math.ceil(box.x + 4), Math.ceil(box.y + 4), Math.max(1, Math.floor(box.width - 8)), Math.max(1, Math.floor(box.height - 8))).data;
        for (let i = 0; i < pixels.length; i += 4) {
          const bg = luma([...pixels.slice(i, i + 3)]);
          minimum = Math.min(minimum, (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05));
        }
        return { selector: box.selector, minimum };
      });
    }, { data: `data:image/png;base64,${shot.toString('base64')}`, boxes });
    // Nền trắng/đen là thử cực trị riêng vật liệu kính; hero kiểm bằng hai ảnh thật cực trị đã tuyển.
    const tested = heroOnly ? ratios.filter(r => !r.selector.includes('search') && !r.selector.includes('tabbar')) : ['white', 'black'].includes(item.file) ? ratios.filter(r => r.selector.includes('search') || r.selector.includes('tabbar')) : ratios;
    results.push({ file: item.file, scope: ['white', 'black'].includes(item.file) ? 'glass controls' : 'hero and glass', ratios: tested });
    await page.evaluate(() => document.querySelectorAll('[style]').forEach(el => {
      if (el.style.color === 'transparent') el.style.removeProperty('color');
    }));
  }
  fs.writeFileSync(`${outputDir}/contrast${heroOnly ? '-hero' : ''}.json`, JSON.stringify(results, null, 2));
  assert.ok(results.every(r => r.ratios.every(ratio => ratio.minimum >= 4.5)), 'mọi vùng chữ phải đạt 4.5:1');
  console.log(`PASS ${results.length} nền, tương phản nhỏ nhất ${Math.min(...results.flatMap(r => r.ratios.map(x => x.minimum))).toFixed(2)}:1`);
} finally { await browser.close(); await server.close(); }
