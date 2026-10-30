// Báo cáo khảo sát local: ảnh ứng viên, credit và dữ liệu OSM để xem trước khi nhập catalog.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'docs/research/da-lat-poi-trial');
const stats = JSON.parse(fs.readFileSync(path.join(dir, 'coverage.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(dir, 'pois.json'), 'utf8'));
const photos = JSON.parse(fs.readFileSync(path.join(dir, 'photo-candidates.json'), 'utf8'));
const curation = JSON.parse(fs.readFileSync(path.join(dir, 'curation.json'), 'utf8'));
assert.equal(data.pois.length, stats.total);
assert.equal(new Set(photos.map(p => p.sourceUrl)).size, photos.length);
assert.ok(data.pois.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lon)));
assert.ok(photos.every(p => p.width >= 1400 && p.height >= 800 && p.author && p.license && p.sourceUrl));
const used = new Set(photos.filter(p => p.localFile).map(p => path.basename(p.localFile)));
const archive = path.join(root, '.logs/da-lat-poi-trial/unused-photos');
fs.mkdirSync(archive, { recursive: true });
for (const file of fs.readdirSync(path.join(dir, 'photos'))) {
  if (/^candidate-(?:[a-f0-9]{12}|\d{2})\.(jpg|jpeg|png|webp)$/.test(file) && !used.has(file)) fs.renameSync(path.join(dir, 'photos', file), path.join(archive, file));
}
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const shortlist = curation.photos.map(review => {
  const p = photos.find(p => p.title === review.title);
  assert.ok(p?.localFile, 'Missing curated image: ' + review.title);
  return { ...review, photo: p, osmCandidates: review.osmCandidateIds.map(id => data.pois.find(p => p.id === id)).filter(Boolean) };
});
fs.writeFileSync(path.join(dir, 'shortlist.json'), JSON.stringify(shortlist, null, 2));
const sample = [...shortlist.map(s => s.photo), ...photos.filter(p => p.localFile && !shortlist.some(s => s.title === p.title))];
const cards = sample.map(p => {
  const review = curation.photos.find(review => review.title === p.title);
  return `<article><a href="${escape(p.sourceUrl)}"><img src="${escape(p.localFile)}" alt="${escape(p.title)}"></a><div><p class="badge">${escape(review?.use ?? 'Ứng viên · chưa tuyển')}</p><h2>${escape(review?.venue ?? p.title.replace('File:', ''))}</h2>${review ? `<p>${escape(review.reason)}</p><p><small>${escape(review.locationStatus)}</small></p>` : ''}<p>${escape(p.query)} · ${p.width} × ${p.height}</p><p>${escape(p.author)} · <a href="${escape(p.licenseUrl ?? p.sourceUrl)}">${escape(p.license)}</a></p><details><summary>Nguồn & mô tả</summary><p>${escape(p.description)}</p><a href="${escape(p.sourceUrl)}">Trang ảnh và giấy phép</a></details></div></article>`;
});
const names = data.pois.filter(p => p.name).slice(0, 24).map(p => `<tr><td><a href="${escape(p.sourceUrl)}">${escape(p.name)}</a></td><td>${escape(p.category)}</td><td>${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</td><td>${escape(p.tags.opening_hours ?? 'Chưa có')}</td></tr>`).join('');
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wander · Khảo sát ảnh và POI Đà Lạt</title><style>body{font:16px/1.55 system-ui,sans-serif;color:#24382d;background:#f5f3eb;margin:0}main{max-width:1320px;margin:36px auto;padding:0 24px}h1{font-size:38px;line-height:1.2;max-width:900px}.lead{max-width:900px}.stats{display:flex;flex-wrap:wrap;gap:14px;margin:28px 0}.stat{background:#fff;padding:18px 24px;border-radius:16px}.stat strong{display:block;font-size:28px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}article{background:white;border-radius:16px;overflow:hidden}article img{width:100%;height:245px;object-fit:contain;background:#e9e8e2;display:block}article div{padding:16px}h2{font-size:17px;overflow-wrap:anywhere}p{margin:8px 0}.badge{color:#77591a;font-size:13px;font-weight:650}a{color:#186746}details{font-size:13px}table{border-collapse:collapse;width:100%;background:white}td,th{text-align:left;padding:10px;border-bottom:1px solid #ddd}aside{background:#fff2cc;padding:18px;border-radius:12px;margin:24px 0}@media(max-width:850px){.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.gallery{grid-template-columns:1fr}h1{font-size:28px}table{font-size:12px}}</style><main><p>WANDER / THỬ NGUỒN DỮ LIỆU MỞ / 29.10.2026</p><h1>Đà Lạt: có vị trí quán, nhưng ảnh đẹp cần tuyển chọn riêng</h1><p class="lead">Khảo sát bbox ${escape(data.bbox)}. Đây là số đối tượng OSM, chưa khử trùng thành cơ sở kinh doanh; không phải thống kê đầy đủ toàn thành phố. Ảnh dưới đây có metadata giấy phép mở và đạt ngưỡng kích thước; độ đẹp và đúng địa điểm cần xem thủ công.</p><div class="stats">${[[stats.total,'POI ăn/uống'],[stats.byCategory.restaurant,'nhà hàng'],[stats.byCategory.cafe,'quán cà phê'],[stats.withImageTag,'POI có tag ảnh'],[stats.qualifiedPhotoCandidates,'ảnh ứng viên Commons']].map(([n,label])=>`<div class="stat"><strong>${n}</strong>${label}</div>`).join('')}</div><aside>Không có rating Google. Không gắn ảnh ly cà phê hoặc quán khác cho một địa điểm. Ảnh cũ không chứng minh quán hiện còn mở. Bản thử chưa được nhập vào catalog chính. Xem <a href="REPORT.md">báo cáo và danh sách ảnh đã xem</a>.</aside><h2>Ảnh tải về để tuyển chọn</h2><div class="gallery">${cards}</div><h2>Mẫu POI có tọa độ</h2><table><thead><tr><th>Địa điểm</th><th>Loại</th><th>Lat, lon</th><th>Giờ mở cửa (OSM)</th></tr></thead><tbody>${names}</tbody></table><p>Dữ liệu © OpenStreetMap contributors, <a href="https://www.openstreetmap.org/copyright">ODbL</a>. Ảnh theo giấy phép riêng ở từng thẻ. Nguồn OSM: ${escape(data.osmTimestamp)}.</p></main></html>`;
fs.writeFileSync(path.join(dir, 'index.html'), html.replace(`<div class="gallery">${cards}</div>`, `<div class="gallery">${cards.slice(0, 4).join('')}</div><details><summary>Xem thêm ${cards.length - 4} ảnh khảo sát, chưa tuyển</summary><div class="gallery">${cards.slice(4).join('')}</div></details>`));
const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
if (!executablePath) { console.log('HTML ready; no installed browser found for preview screenshot.'); process.exit(0); }
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
  const broken = await page.locator('img').evaluateAll(images => images.filter(img => !img.naturalWidth).length);
  await page.screenshot({ path: path.join(dir, 'preview.jpg'), fullPage: true, type: 'jpeg', quality: 82 });
  assert.equal(broken, 0);
  const verification = { galleryImages: sample.length, curatedImages: shortlist.length, brokenImages: broken, datasetInvariants: 'PASS', browser: 'installed Chromium/Edge', checkedAt: new Date().toISOString(), preview: path.join(dir, 'preview.jpg') };
  fs.writeFileSync(path.join(root, '.logs/da-lat-poi-trial/verification.json'), JSON.stringify(verification, null, 2));
  console.log(JSON.stringify(verification));
} finally { await browser.close(); }
