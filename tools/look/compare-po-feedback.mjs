import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';

const OUT = path.resolve(import.meta.dirname, '../../.logs/look-real/po-feedback');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const group of [['home'], ['destinations'], ['destination'], ['map-place'], ['trips', 'trip']]) {
    const page = await browser.newPage({ viewport: { width: 780 * group.length, height: 876 } });
    const figures = group.flatMap(id => ['before', 'after'].map(phase => {
      const data = fs.readFileSync(path.join(OUT, phase, `${id}.png`)).toString('base64');
      return `<figure><figcaption>${id} — ${phase}</figcaption><img src="data:image/png;base64,${data}"></figure>`;
    }));
    await page.setContent(`<style>body{margin:0;display:flex}figure{margin:0;width:390px}figcaption{height:32px;font:14px system-ui;text-align:center}img{width:390px;display:block}</style>${figures.join('')}`);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
    await page.screenshot({ path: path.join(OUT, `compare-${group.join('-')}.png`) });
    await page.close();
  }
} finally {
  await browser.close();
}
