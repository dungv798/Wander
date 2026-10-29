import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { readCatalog } from './capture-fixtures.mjs';

const OUT = path.resolve('.logs/look-real/hero');
const PHOTO_ROOT = path.resolve('backend/src/main/resources/catalog/photos');
const LIMIT = 4;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const rows = [];
const selection = {};
try {
  const page = await browser.newPage();
  for (const dest of readCatalog()) {
    for (const place of dest.places) for (const photo of place.photos) {
      const file = photo.url.replace('/catalog/photos/', '');
      const bytes = fs.readFileSync(path.join(PHOTO_ROOT, file));
      const metrics = await page.evaluate(async data => {
        const img = new Image();
        img.src = data;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 156; canvas.height = 180;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        // Crop cover giống hero 390×448: không chấm vùng bị cắt mất trên điện thoại.
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        ctx.drawImage(img, (canvas.width - img.width * scale) / 2, (canvas.height - img.height * scale) / 2, img.width * scale, img.height * scale);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const lumas = [], lower = []; let saturation = 0, edges = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const [r, g, b] = pixels.slice(i, i + 3);
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          saturation += max ? (max - min) / max : 0;
          const luma = (.2126 * r + .7152 * g + .0722 * b) / 255;
          lumas.push(luma);
          if (i / 4 >= canvas.width * canvas.height / 2) {
            lower.push(luma);
            if (i / 4 % canvas.width) edges += Math.abs(luma - lumas.at(-2));
          }
        }
        const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
        const deviation = values => { const average = mean(values); return Math.sqrt(mean(values.map(v => (v - average) ** 2))); };
        const brightness = mean(lumas), contrast = deviation(lumas);
        const stability = Math.max(0, 1 - deviation(lower) - edges / lower.length);
        return { brightness, saturation: saturation / lumas.length, contrast, lowerStability: stability };
      }, `data:image/${path.extname(file) === '.png' ? 'png' : 'jpeg'};base64,${bytes.toString('base64')}`);
      const eligible = metrics.brightness >= .32 && metrics.brightness <= .84 && metrics.saturation >= .17 && metrics.contrast >= .12;
      const score = metrics.brightness * .30 + metrics.saturation * .30 + metrics.contrast * .15 + metrics.lowerStability * .25;
      rows.push({ destination: dest.id, place: place.id, photo: photo.id, file, ...metrics, eligible, score });
    }
    const ranked = rows.filter(r => r.destination === dest.id && r.eligible).sort((a, b) => b.score - a.score);
    // Tránh một địa danh chiếm cả chuỗi; ít ảnh đạt thì dùng đúng số có thật.
    const chosen = ranked.filter((r, i, all) => all.findIndex(other => other.place === r.place) === i).slice(0, LIMIT);
    selection[dest.id] = chosen.map(r => r.file);
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(OUT, 'analysis.json'), JSON.stringify({ crop: '390x448 cover', thresholds: { brightness: [.32, .84], saturation: .17, contrast: .12 }, rows, selection }, null, 2));
fs.writeFileSync('web/src/features/discover/model/heroPhotos.const.ts', `/** Ảnh hero xếp hạng offline theo sáng, sắc, tương phản và ổn định vùng chữ; xem tools/look/hero-selection.md. */\nexport const HERO_PHOTOS: Readonly<Record<string, readonly string[]>> = ${JSON.stringify(selection, null, 2)} as const;\n`);
fs.writeFileSync('tools/look/hero-selection.md', `# Chọn ảnh hero\n\nChạy offline: \`node tools/look/analyze-hero.mjs\`. Không thêm thư viện, không gọi mạng.\nChấm crop cover 390×448 bằng canvas: sáng trung bình sRGB, bão hòa HSV, tương phản (độ lệch chuẩn độ sáng), ổn định nửa dưới (1 − độ lệch chuẩn − chênh lệch pixel ngang). Đây là heuristic kỹ thuật, không thay thế thẩm định nội dung ảnh.\n\nLoại sáng <0,32 hoặc >0,84; bão hòa <0,17; tương phản <0,12. Điểm = sáng×0,30 + bão hòa×0,30 + tương phản×0,15 + ổn định×0,25. Tối đa bốn ảnh, mỗi nơi một ảnh; không ảnh đạt thì FE giữ ảnh bìa. Chỉ dùng ảnh vẫn có trong API. Số liệu từng ảnh: .logs/look-real/hero/analysis.json.\n\n${Object.entries(selection).map(([id, files]) => `- **${id}**: ${files.length ? files.join(', ') : 'fallback ảnh bìa'}; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.`).join('\n')}\n`);
console.log(JSON.stringify({ analyzed: rows.length, selection }));
