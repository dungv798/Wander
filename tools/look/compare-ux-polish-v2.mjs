import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
const out = path.resolve('.logs/ux-polish/v2');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
 for (const [file, names, phases, columns] of [
  ['after-contact.png', ['home', 'unselected', 'detail', 'settings', 'security', 'recover', 'join', 'expired'], ['after'], 4],
  ['hero-after.png', ['home', 'unselected'], ['after'], 2]
 ]) {
  const figures = phases.flatMap(phase => names.map(name => `<figure><figcaption>${phase}: ${name}</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(out, phase, name + '.png')).toString('base64')}"></figure>`));
  const page = await browser.newPage({ viewport: { width: 390 * columns, height: 876 * Math.ceil(figures.length / columns) } });
  await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(${columns},390px)}figure{margin:0}figcaption{height:32px;font:14px system-ui;text-align:center}img{display:block;width:390px}</style>${figures.join('')}`);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  await page.screenshot({ path: path.join(out, file) }); await page.close();
 }
} finally { await browser.close(); }
