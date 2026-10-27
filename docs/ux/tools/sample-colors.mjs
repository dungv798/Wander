// Đo màu thật từ ảnh chụp tham chiếu trong docs/UI-sample (điểm do người xem chọn, tọa độ theo ảnh hiển thị 923x2000, nhân 1,398 ra ảnh gốc 1290x2796).
//   node docs/ux/tools/sample-colors.mjs
// Chỉ để tham khảo gu màu của PO; không sao chép thương hiệu.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const dir = path.resolve('docs/UI-sample');
const k = 1290 / 923;
const stamp = (s) => fs.readdirSync(dir).find((f) => f.includes(s));
// [mã ảnh, nhãn, x, y] theo tọa độ ảnh hiển thị
const points = [
  ['1792829385235', 'nút chính (trái)', 70, 1840], ['1792829385235', 'nút chính (giữa)', 460, 1840], ['1792829385235', 'nút chính (phải)', 850, 1840],
  ['1792829385235', 'thẻ đào (giữa-trên)', 120, 760], ['1792829385235', 'thẻ đào (giữa-dưới)', 120, 1040], ['1792829385235', 'chữ logo', 330, 330],
  ['1792829385404', 'nền trời (trên)', 100, 120], ['1792829385404', 'nền trời (giữa)', 100, 1700],
  ['1792829385666', 'thẻ Trip Stats (đào)', 300, 680], ['1792829385666', 'thẻ Checklist (xanh)', 700, 970], ['1792829385666', 'thẻ Discounts (tím)', 300, 1240],
  ['1792829385666', 'nền tờ dưới (xanh nhạt)', 40, 1500],
  ['1792829385720', 'nhãn DAY 5 (vàng)', 400, 182], ['1792829385720', 'nhãn DAY 4 (tím)', 250, 291], ['1792829385720', 'nhãn DAY 3 (lục)', 260, 415], ['1792829385720', 'nhãn DAY 2 (lam)', 400, 481], ['1792829385720', 'nhãn DAY 7 (ngọc)', 430, 598],
  ['1792829385379', 'thẻ 93% (xanh lá)', 100, 760],
  ['1792829385561', 'nút Next', 700, 1850], ['1792829385561', 'chip All Regions', 100, 622],
  ['1792829385827', 'nền Share (xanh nhạt)', 80, 330], ['1792829385827', 'chip 7 days nền', 440, 710],
];

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const page = await browser.newPage();
const cache = new Map();
const hex = (n) => n.toString(16).padStart(2, '0');
for (const [id, label, x, y] of points) {
  const file = stamp(id);
  if (!file) { console.log(`${label}: KHÔNG THẤY ảnh ${id}`); continue; }
  if (!cache.has(file)) cache.set(file, 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, file)).toString('base64'));
  const px = await page.evaluate(async ({ src, x, y }) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    // trung bình khối 9x9 để bớt nhiễu nén
    const d = g.getImageData(Math.max(0, x - 4), Math.max(0, y - 4), 9, 9).data; let r = 0, gr = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++; }
    return [Math.round(r / n), Math.round(gr / n), Math.round(b / n), img.width, img.height];
  }, { src: cache.get(file), x: Math.round(x * k), y: Math.round(y * k) });
  console.log(`${label.padEnd(28)} #${hex(px[0])}${hex(px[1])}${hex(px[2])}   (ảnh ${px[3]}x${px[4]})`);
}
await browser.close();
