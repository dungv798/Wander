// Ảnh THEO CHỦ ĐỀ (người, chợ, món ăn, lễ hội, nghề) cho từng điểm đến, từ Openverse (DR-034). Chạy lại được, chỉ ghi vào docs/research.
//   node tools/catalog/photo-themes.mjs candidates --dest=hoi-an [--per=6]   (tạo <dest>.themes.json + <dest>.themes.html để XEM ảnh)
//   node tools/catalog/photo-themes.mjs apply --dest=hoi-an                  (đọc <dest>.themes.curation.json, tải ảnh đã duyệt, THÊM vào "moments" của <dest>.json)
// Giấy phép chấp nhận: CC BY, CC BY-SA, CC0, PDM (không NC/ND). Mỗi ảnh lưu tác giả + giấy phép + liên kết trang gốc để ghi nguồn.
// Ảnh chỉ MINH HỌA không khí điểm đến (chợ, món ăn, người), KHÔNG khẳng định đúng một địa điểm cụ thể.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const CATALOG_DIR = path.join(ROOT, 'backend/src/main/resources/catalog');
const PHOTO_DIR = path.join(CATALOG_DIR, 'photos');
const WORK_DIR = path.join(ROOT, 'docs/research/photo-candidates');
const API = 'https://api.openverse.org/v1/images/';
const UA = 'WanderCatalog/0.2 (learning project; contact binkuteqn289@gmail.com)';

const [, , COMMAND = '', ...rest] = process.argv;
const arg = (k, d) => (rest.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const DEST = arg('dest', '');
const PER_THEME = Number(arg('per', '6'));
const HOST = arg('host', ''); // chỉ tải ảnh có địa chỉ chứa chuỗi này (ví dụ staticflickr khi máy chủ khác tạm hỏng)

const GAP_MS = 1500;
const RETRIES = 4;
const MIN_SHORT_SIDE = 640;
const AUTHOR_MAX = 80;
const OK_LICENSES = new Set(['by', 'by-sa', 'cc0', 'pdm']);
const NOISE = /(logo|map|flag|icon|screenshot|diagram|poster|advert|stamp|coin)/i;
/** Tên tiếng Anh dùng để tìm (nguồn gắn thẻ tiếng Anh nhiều hơn tiếng Việt). */
const DEST_QUERY = {
  'da-lat': 'Da Lat', 'da-nang': 'Da Nang', 'ha-giang': 'Ha Giang', 'ha-noi': 'Hanoi', 'ho-chi-minh': 'Saigon',
  'hoi-an': 'Hoi An', hue: 'Hue Vietnam', 'nha-trang': 'Nha Trang', 'phu-yen': 'Phu Yen', 'quy-nhon': 'Quy Nhon',
  'ta-xua': 'Ta Xua', 'vinh-hy': 'Vinh Hy Ninh Thuan',
};
/** Chủ đề → từ khóa; nhãn tiếng Việt hiện cho người dùng. */
const THEMES = [
  { id: 'cho', label: 'Chợ & phố', words: ['market', 'street vendor'] },
  { id: 'mon-an', label: 'Món ăn', words: ['food', 'street food'] },
  { id: 'nguoi', label: 'Con người', words: ['local people', 'woman'] },
  { id: 'le-hoi', label: 'Lễ hội & văn hóa', words: ['festival', 'traditional'] },
  { id: 'nghe', label: 'Nghề & đời sống', words: ['farmer', 'fisherman', 'coffee'] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Gọi Openverse; lỗi 5xx/429 thì chờ và thử lại (dịch vụ ẩn danh hay trả 500 tạm thời). */
async function searchOpenverse(q) {
  const url = `${API}?${new URLSearchParams({ q, license_type: 'commercial', page_size: '20', mature: 'false' })}`;
  for (let i = 0; i < RETRIES; i++) {
    await sleep(GAP_MS * (i + 1));
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return (await res.json()).results ?? [];
    if (res.status < 500 && res.status !== 429) return [];
  }
  return [];
}

/** Giữ ảnh đủ lớn, giấy phép mở, không phải logo/bản đồ. */
function accept(r, place) {
  const short = Math.min(r.width ?? 0, r.height ?? 0);
  const haystack = `${r.title ?? ''} ${(r.tags ?? []).map((t) => t.name).join(' ')}`.toLowerCase();
  const named = haystack.includes(place.toLowerCase().replace(' vietnam', '').replace(' ninh thuan', ''));
  return named && OK_LICENSES.has(String(r.license).toLowerCase()) && short >= MIN_SHORT_SIDE && !NOISE.test(r.title ?? '') && r.url && r.foreign_landing_url;
}

async function candidates() {
  const place = DEST_QUERY[DEST];
  if (!place) throw new Error(`--dest không hợp lệ: ${DEST}`);
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const seen = new Set();
  const out = [];
  for (const theme of THEMES) {
    const list = [];
    for (const w of theme.words) {
      for (const r of await searchOpenverse(`${place} ${w}`)) {
        if (!accept(r, place) || seen.has(r.id)) continue;
        seen.add(r.id);
        list.push({
          id: r.id, theme: theme.id, title: r.title ?? '', creator: (r.creator ?? 'Không rõ').slice(0, AUTHOR_MAX),
          license: `CC ${String(r.license).toUpperCase()}${r.license_version ? ` ${r.license_version}` : ''}`,
          url: r.url, thumb: r.thumbnail ?? r.url, landing: r.foreign_landing_url, width: r.width, height: r.height, source: r.source,
        });
      }
    }
    out.push({ theme: theme.id, label: theme.label, candidates: list.slice(0, PER_THEME * 3) });
    console.log(`${DEST}/${theme.id}: ${list.length} ứng viên`);
  }
  fs.writeFileSync(path.join(WORK_DIR, `${DEST}.themes.json`), JSON.stringify(out, null, 1));
  const html = `<meta charset=utf-8><style>body{font:13px sans-serif}figure{display:inline-block;width:240px;margin:6px;vertical-align:top}img{width:240px;height:180px;object-fit:cover}</style><h1>${esc(DEST)}</h1>${out.map((t) => `<h2>${esc(t.label)}</h2>${t.candidates.map((c, i) => `<figure><img src="${esc(c.thumb)}"><figcaption><b>${esc(t.theme)}#${i + 1}</b> ${c.width}×${c.height}<br>${esc(c.license)} · ${esc(c.creator.slice(0, 30))}<br><small>${esc(c.title.slice(0, 60))}</small></figcaption></figure>`).join('')}`).join('')}`;
  fs.writeFileSync(path.join(WORK_DIR, `${DEST}.themes.html`), html);
}

const FETCH_TIMEOUT_MS = 30000;
const THUMB_WIDTH = 1280;
const WARN_BYTES = 1_500_000;

/** Các địa chỉ có thể tải theo thứ tự ưu tiên (bản thu nhỏ trước, gốc sau): Commons thumb 1280px; Flickr hậu tố _b (1024px). */
function downloadUrls(url) {
  const commons = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f]\/[0-9a-f]{2})\/([^/]+)$/);
  if (commons) return [`${commons[1]}/thumb/${commons[2]}/${commons[3]}/${THUMB_WIDTH}px-${commons[3]}`, url];
  const flickr = url.match(/^(https:\/\/live\.staticflickr\.com\/.+?)(_[a-z])?\.jpg$/);
  return flickr ? [`${flickr[1]}_b.jpg`, url] : [url];
}

/** Tải byte của ảnh từ danh sách địa chỉ; trả null nếu tất cả đều lỗi. */
async function fetchFirst(urls) {
  for (const u of urls) {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      await sleep(GAP_MS * attempt);
      try {
        const res = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (res.ok) return Buffer.from(await res.arrayBuffer());
        if (res.status < 500 && res.status !== 429) break; // lỗi vĩnh viễn: thử địa chỉ kế tiếp
      } catch {
        // mạng ngắt: chờ rồi thử lại
      }
    }
  }
  return null;
}

/** Tải ảnh đã duyệt (theme + chỉ số trong curation) và THÊM vào moments; không ghi đè mục đã có. */
async function apply() {
  const cand = JSON.parse(fs.readFileSync(path.join(WORK_DIR, `${DEST}.themes.json`), 'utf8'));
  const pick = JSON.parse(fs.readFileSync(path.join(WORK_DIR, `${DEST}.themes.curation.json`), 'utf8')); // { "cho": [{"n":1,"caption":"..."}] }
  const catalogPath = path.join(CATALOG_DIR, `${DEST}.json`);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  catalog.moments ??= [];
  for (const [themeId, items] of Object.entries(pick)) {
    const theme = cand.find((t) => t.theme === themeId);
    for (const it of items) {
      const c = theme?.candidates[it.n - 1];
      if (!c || catalog.moments.some((m) => m.sourceUrl === c.landing)) continue;
      if (HOST && !c.url.includes(HOST)) { console.log(`hoãn #${it.n} ${themeId}: không thuộc --host=${HOST}`); continue; }
      const file = `${DEST}-moment-${themeId}-${catalog.moments.length + 1}.jpg`;
      const bytes = await fetchFirst(downloadUrls(c.url));
      if (!bytes) { console.log(`bỏ qua #${it.n} ${themeId}: không tải được`); continue; }
      if (bytes.length > WARN_BYTES) console.log(`CẢNH BÁO ${file}: ${(bytes.length / 1e6).toFixed(1)} MB (nặng)`);
      fs.writeFileSync(path.join(PHOTO_DIR, file), bytes);
      catalog.moments.push({ id: `${themeId}-${catalog.moments.length + 1}`, theme: themeId, caption: it.caption, file, author: c.creator, license: c.license, sourceUrl: c.landing });
    }
  }
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`${DEST}: moments = ${catalog.moments.length}`);
}

if (COMMAND === 'candidates') await candidates();
else if (COMMAND === 'apply') await apply();
else console.log('Dùng: candidates|apply --dest=<mã>');
