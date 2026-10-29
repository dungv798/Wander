import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';

const OUT = path.resolve(import.meta.dirname, '../../.logs/look-real/v2');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const id of ['home', 'destinations', 'deck', 'detail', 'trips', 'picked']) {
    const page = await browser.newPage({ viewport: { width: 780, height: id === 'detail' ? 1266 : 876 } });
    const figures = ['before', 'after'].map(phase => `<figure><figcaption>${id} — ${phase}</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, phase, `${id}.png`)).toString('base64')}"></figure>`);
    const probe = id === 'detail' ? `<img class="probe" src="data:image/png;base64,${fs.readFileSync(path.join(OUT, 'glass-photos.png')).toString('base64')}">` : '';
    await page.setContent(`<style>body{margin:0;display:flex;flex-wrap:wrap}figure{margin:0;width:390px}figcaption{height:32px;font:14px system-ui;text-align:center}img{width:390px;display:block}.probe{width:780px}</style>${figures.join('')}${probe}`);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
    await page.screenshot({ path: path.join(OUT, `compare-${id}.png`) });
    await page.close();
  }
  console.log('PASS 6 ảnh đối chiếu; ảnh chi tiết kèm thử kính trên catalog sáng/tối');
} finally { await browser.close(); }
