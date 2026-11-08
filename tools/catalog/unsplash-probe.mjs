// Thăm dò Unsplash (DR-034): mỗi điểm đến một truy vấn, ghi số kết quả + mô tả + tác giả vào docs/research/image-sources/unsplash-probe.json.
// Khóa đọc từ biến môi trường UNSPLASH_ACCESS_KEY hoặc .env.local (không bao giờ ghi ra tệp hay log).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'docs/research/image-sources/unsplash-probe.json');
const PER_PAGE = 10;
const GAP_MS = 1000;
const QUERIES = {
  'da-lat': 'Da Lat Vietnam', 'da-nang': 'Da Nang Vietnam', 'ha-giang': 'Ha Giang Vietnam', 'ha-noi': 'Hanoi old quarter', 'ho-chi-minh': 'Ho Chi Minh City Saigon',
  'hoi-an': 'Hoi An Vietnam', hue: 'Hue Vietnam', 'nha-trang': 'Nha Trang', 'phu-yen': 'Phu Yen Vietnam', 'quy-nhon': 'Quy Nhon Vietnam', 'ta-xua': 'Ta Xua Vietnam', 'vinh-hy': 'Vinh Hy Ninh Thuan',
};

/** Đọc khóa từ môi trường hoặc .env.local; thiếu thì dừng. */
function readKey() {
  if (process.env.UNSPLASH_ACCESS_KEY) return process.env.UNSPLASH_ACCESS_KEY;
  const file = path.join(ROOT, '.env.local');
  const line = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('UNSPLASH_ACCESS_KEY=')) : undefined;
  if (!line) throw new Error('Thiếu UNSPLASH_ACCESS_KEY');
  return line.slice('UNSPLASH_ACCESS_KEY='.length).trim();
}

const key = readKey();
const result = {};
let remaining = '?';
for (const [dest, q] of Object.entries(QUERIES)) {
  await new Promise((r) => setTimeout(r, GAP_MS));
  const url = `https://api.unsplash.com/search/photos?${new URLSearchParams({ query: q, per_page: String(PER_PAGE), orientation: 'portrait', content_filter: 'high' })}`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' }, signal: AbortSignal.timeout(20000) });
  remaining = res.headers.get('x-ratelimit-remaining') ?? remaining;
  if (!res.ok) { result[dest] = { error: res.status }; console.log(dest, 'HTTP', res.status); continue; }
  const j = await res.json();
  result[dest] = { query: q, total: j.total, photos: j.results.map((p) => ({ id: p.id, alt: p.alt_description, desc: p.description, w: p.width, h: p.height, author: p.user.name, authorUrl: p.user.links.html, page: p.links.html, thumb: p.urls.small, location: p.location?.name ?? null })) };
  console.log(dest.padEnd(12), 'tổng', String(j.total).padStart(6), '| có vị trí gắn thẻ:', result[dest].photos.filter((p) => p.location).length, '/', result[dest].photos.length);
}
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log('lượt gọi còn lại trong giờ:', remaining);
