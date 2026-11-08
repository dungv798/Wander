import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';

/** Dựng sẵn 3 đám mây khối (nền trong suốt) cho onboarding bằng bộ lọc nhiễu SVG, để trang chạy không phải vẽ lại bộ lọc: node tools/tvc/render-clouds.mjs */
/** OUT: thư mục ra; FORMAT: png | webp; WIDTH: bề rộng ảnh ra (px). */
const OUT = path.resolve(process.env.OUT ?? 'web/spike/onboard-story/assets'), FORMAT = process.env.FORMAT ?? 'png', WIDTH = Number(process.env.WIDTH ?? 1200);
fs.mkdirSync(OUT, { recursive: true });
const BG = 'radial-gradient(ellipse 80% 34% at 50% 80%, rgb(200 216 238 / .75) 0 45%, transparent 100%), radial-gradient(ellipse 30% 52% at 26% 56%, #fff 0 58%, transparent 100%), radial-gradient(ellipse 27% 70% at 48% 40%, #fff 0 58%, transparent 100%), radial-gradient(ellipse 30% 55% at 72% 56%, #fff 0 58%, transparent 100%), radial-gradient(ellipse 60% 40% at 50% 62%, #f4f8fd 0 70%, transparent 100%)';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [i, seed] of [3, 7, 12].entries()) {
  const page = await browser.newPage({ viewport: { width: 1500, height: 800 } });
  await page.setContent(`<body style="margin:0;background:transparent"><svg width="0" height="0" style="position:absolute"><filter id="f" x="-20%" y="-30%" width="140%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".011 .016" numOctaves="4" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="60" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="2"/></filter></svg><div style="position:absolute;left:250px;top:180px;width:1000px;height:${[435, 400, 470][i]}px;background:${BG};filter:url(#f)"></div></body>`);
  await page.waitForTimeout(400);
  const shot = await page.screenshot({ omitBackground: true, clip: { x: 150, y: 80, width: 1200, height: 640 } });
  const out = await page.evaluate(async ({ b64, mime, w }) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const k = w / img.width, cv = document.createElement('canvas'); cv.width = w; cv.height = Math.round(img.height * k); const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, cv.width, cv.height); return cv.toDataURL(mime, 0.88).split(',')[1]; }, { b64: shot.toString('base64'), mime: FORMAT === 'webp' ? 'image/webp' : 'image/png', w: WIDTH });
  fs.writeFileSync(path.join(OUT, `cloud${i + 1}.${FORMAT}`), Buffer.from(out, 'base64'));
  await page.close(); console.log('saved cloud' + (i + 1));
}
await browser.close();
