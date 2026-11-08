// Ảnh Unsplash cho Khoảnh khắc và ảnh bìa (DR-034). Unsplash BẮT BUỘC hotlink: catalog chỉ lưu URL ảnh + tác giả + liên kết gốc, không tải tệp về.
//   node tools/catalog/unsplash-moments.mjs candidates --dest=ha-giang [--q="Ha Giang Vietnam"] [--per=30] [--theme=cho]
//   node tools/catalog/unsplash-moments.mjs apply --dest=ha-giang   (đọc <dest>.unsplash.curation.json: {"moments":[{"n":3,"theme":"cho","caption":"..."}],"cover":5})
// Khóa đọc từ UNSPLASH_ACCESS_KEY hoặc .env.local, KHÔNG bao giờ ghi ra tệp/log. Hạn mức Demo: 50 lượt/giờ.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG_DIR = path.join(ROOT, 'backend/src/main/resources/catalog');
const WORK_DIR = path.join(ROOT, 'docs/research/photo-candidates');
const API = 'https://api.unsplash.com';
const LICENSE = 'Giấy phép Unsplash';
const UTM = 'utm_source=wander&utm_medium=referral';
const IMAGE_WIDTH = 1000;
const IMAGE_QUALITY = 75;
const TIMEOUT_MS = 20000;

const [, , COMMAND = '', ...rest] = process.argv;
const arg = (k, d) => (rest.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const DEST = arg('dest', '');
const QUERY = arg('q', '');
const PER = arg('per', '30');
const THEME = arg('theme', '');
const DEFAULT_QUERY = {
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

/** Gọi API Unsplash (có xác thực), trả JSON và số lượt còn lại trong giờ. */
async function call(url) {
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${readKey()}`, 'Accept-Version': 'v1' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
  return { json: await res.json(), remaining: res.headers.get('x-ratelimit-remaining') };
}

/** URL hotlink của ảnh: cạnh rộng cố định, nén vừa phải (không tải về, tham số theo hướng dẫn imgix của Unsplash). */
function imageUrl(raw) {
  const u = new URL(raw);
  u.searchParams.set('w', String(IMAGE_WIDTH));
  u.searchParams.set('q', String(IMAGE_QUALITY));
  u.searchParams.set('fm', 'jpg');
  u.searchParams.set('fit', 'max');
  return u.toString();
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Tìm ảnh, GỘP vào danh sách ứng viên của điểm đến (không trùng id) và dựng contact sheet có số thứ tự. */
async function candidates() {
  const q = QUERY || DEFAULT_QUERY[DEST];
  if (!q) throw new Error(`--dest không hợp lệ: ${DEST}`);
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const file = path.join(WORK_DIR, `${DEST}.unsplash.json`);
  const list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  const { json, remaining } = await call(`${API}/search/photos?${new URLSearchParams({ query: q, per_page: PER, content_filter: 'high' })}`);
  for (const p of json.results) {
    if (list.some((x) => x.id === p.id)) continue;
    list.push({ id: p.id, query: q, theme: THEME, alt: p.alt_description, desc: p.description, w: p.width, h: p.height, author: p.user.name, page: p.links.html, raw: p.urls.raw, thumb: p.urls.small, download: p.links.download_location });
  }
  fs.writeFileSync(file, JSON.stringify(list, null, 1));
  const figures = list.map((p, i) => `<figure><img src="${esc(p.thumb)}"><figcaption><b>${i + 1}</b> ${p.w}x${p.h} ${esc((p.alt || p.desc || '').slice(0, 38))}</figcaption></figure>`).join('');
  fs.writeFileSync(path.join(WORK_DIR, `${DEST}.unsplash.html`), `<meta charset=utf-8><style>body{margin:0;font:11px sans-serif;display:flex;flex-wrap:wrap;gap:3px}figure{margin:0;width:170px}img{width:170px;height:130px;object-fit:cover;display:block}</style><h3 style="width:100%;margin:2px">${esc(DEST)} (${list.length})</h3>${figures}`);
  console.log(`${DEST}: "${q}" → ${json.results.length} kết quả, tổng ${list.length} ứng viên; còn ${remaining} lượt/giờ`);
}

/** Ghi ảnh đã duyệt vào catalog (moments + coverPhoto tùy chọn) và báo lượt dùng cho Unsplash (download_location); chỉ THÊM, không ghi đè. */
async function apply() {
  const list = JSON.parse(fs.readFileSync(path.join(WORK_DIR, `${DEST}.unsplash.json`), 'utf8'));
  const pick = JSON.parse(fs.readFileSync(path.join(WORK_DIR, `${DEST}.unsplash.curation.json`), 'utf8'));
  const catalogPath = path.join(CATALOG_DIR, `${DEST}.json`);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const credit = (p) => ({ url: imageUrl(p.raw), author: p.author, license: LICENSE, sourceUrl: `${p.page}?${UTM}` });
  catalog.moments ??= [];
  for (const it of pick.moments ?? []) {
    const p = list[it.n - 1];
    if (!p || catalog.moments.some((m) => m.sourceUrl?.startsWith(p.page))) continue;
    catalog.moments.push({ id: `unsplash-${p.id}`, theme: it.theme, caption: it.caption, ...credit(p) });
    await call(p.download).catch((e) => console.log(`CẢNH BÁO báo lượt dùng ${p.id}: ${e.message}`));
  }
  if (pick.cover) {
    const p = list[pick.cover - 1];
    if (p) { catalog.coverPhoto = credit(p); await call(p.download).catch((e) => console.log(`CẢNH BÁO báo lượt dùng ${p.id}: ${e.message}`)); }
  }
  if (!catalog.moments.length) delete catalog.moments;
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`${DEST}: moments = ${catalog.moments?.length ?? 0}${catalog.coverPhoto ? ', có ảnh bìa Unsplash' : ''}`);
}

if (COMMAND === 'candidates') await candidates();
else if (COMMAND === 'apply') await apply();
else console.log('Dùng: candidates|apply --dest=<mã>');
