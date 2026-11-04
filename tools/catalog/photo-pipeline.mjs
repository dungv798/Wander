// Pipeline ẢNH riêng, tách khỏi dựng địa điểm (DR-033). Chạy lại được; KHÔNG ghi đè nội dung biên tập hay ảnh đã tuyển.
//   node tools/catalog/photo-pipeline.mjs candidates --dest=hoi-an [--place=<mã>] [--want=4]
//   node tools/catalog/photo-pipeline.mjs sheet      --dest=hoi-an        (dựng contact sheet HTML để XEM ảnh)
//   node tools/catalog/photo-pipeline.mjs apply      --dest=hoi-an        (chỉ THÊM ảnh đã duyệt trong <dest>.curation.json)
// Nguồn: Wikidata P18/P373, danh mục Commons, tìm Commons theo tên (vi/khác/Anh + vùng), geosearch Commons (CHỈ tạo danh sách ứng viên,
// không tự gắn ảnh gần nhất). Mỗi tệp vẫn kiểm giấy phép riêng (CC BY, CC BY-SA, CC0, Public domain; không NC/ND). Hướng dẫn tái sử dụng:
// https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia (ghi tác giả, giấy phép và liên kết tới trang tệp).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const CATALOG_DIR = path.join(ROOT, 'backend/src/main/resources/catalog');
const PHOTO_DIR = path.join(CATALOG_DIR, 'photos');
const WORK_DIR = path.join(ROOT, 'docs/research/photo-candidates');
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA = 'https://www.wikidata.org/w/api.php';
const VI = 'https://vi.wikipedia.org/w/api.php';
const UA = 'WanderCatalog/0.2 (learning project; contact binkuteqn289@gmail.com)';

const [, , COMMAND = '', ...rest] = process.argv;
const arg = (k, d) => (rest.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const DEST = arg('dest', '');
const ONLY_PLACE = arg('place', '');
const WANT_MUST = Number(arg('want', '4'));

const GAP_MS = 350;
const MIN_SIDE = 700; // cạnh ngắn tối thiểu (px): không kéo giãn ảnh nhỏ
const MIN_LONG_SIDE = 1000;
const DOWNLOAD_WIDTH = 1600; // chiều rộng thumb tải về; nguồn nhỏ hơn thì Commons trả nguyên kích thước (không kéo giãn)
const SHEET_WIDTH = 420;
const PER_PLACE_LIMIT = 14;
const GEO_RADIUS_M = 300;
const MIN_NAME_TOKEN = 3;
const TIER = { p18: 100, category: 70, search: 50, geo: 25 };
const OK_LICENSE = /^(CC BY(-SA)? \d(\.\d)?|CC0|Public domain|PD)/i;
const BAD_LICENSE = /(-NC|-ND|non-?commercial|no derivatives|fair use)/i;
const NOISE = /(icon|logo|flag|cờ|map|bản đồ|symbol|commons-|edit-|ambox|question|locator|diagram|sơ đồ|stub|coat of arms|\.svg|\.gif|\.pdf|\.ogg|\.webm)/i;
const RASTER_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/tiff']);
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/tiff': 'jpg' };
const AUTHOR_MAX = 100;
const LANDSCAPE = 1.15;
const COVER_RATIO = 1.4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET JSON lịch sự có thử lại; lỗi mạng/429/5xx thử lại, lỗi khác ném. */
async function getJson(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    await sleep(GAP_MS);
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) return res.json();
    if (res && res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(4000 * attempt);
  }
  throw new Error(`hết lượt thử ${url}`);
}

/** Tải nhị phân có thử lại. */
async function getBytes(url) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    await sleep(GAP_MS);
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) }).catch(() => null);
    if (res?.ok) return Buffer.from(await res.arrayBuffer());
    if (res && res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(4000 * attempt);
  }
  throw new Error(`hết lượt thử ${url}`);
}

/** Bỏ thẻ HTML và khoảng trắng thừa. */
function plain(html) {
  return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
}

/** Chữ thường không dấu để so tên. */
function fold(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
}

/** Các từ có nghĩa của một tên (bỏ từ quá ngắn). */
function tokens(text) {
  return fold(text).split(/[^a-z0-9]+/).filter((w) => w.length >= MIN_NAME_TOKEN);
}

/** Đọc tệp catalog của điểm đến. */
function readCatalog() {
  if (!DEST) throw new Error('Thiếu --dest=<mã điểm đến>');
  return JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, `${DEST}.json`), 'utf8'));
}

/** Tên biến thể để tìm: tên tiếng Việt, bỏ ngoặc, tên bài Wikipedia, nhãn/bí danh Wikidata (vi, en), kèm vùng. */
function nameVariants(place, entity, region) {
  const base = place.name.replace(/\s*\(.*?\)/g, '').trim();
  const set = new Set([place.name, base, place.wikipediaTitle, entity?.labels?.vi?.value, entity?.labels?.en?.value, ...(entity?.aliases?.vi ?? []).map((a) => a.value), ...(entity?.aliases?.en ?? []).map((a) => a.value)].filter(Boolean));
  return { names: [...set], withRegion: base ? [`${base} ${region}`] : [] };
}

/** Mục Wikidata của địa điểm: qua bài vi.wikipedia, hoặc tìm theo tên và kiểm tọa độ trong bán kính (không nhận mục xa). */
async function findEntity(place, region) {
  let qid = null;
  if (place.wikipediaTitle) {
    const r = await getJson(VI, { action: 'query', titles: place.wikipediaTitle, redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item' });
    qid = r.query?.pages?.[0]?.pageprops?.wikibase_item ?? null;
  }
  const candidates = qid ? [qid] : (await getJson(WIKIDATA, { action: 'wbsearchentities', search: place.name.replace(/\s*\(.*?\)/g, ''), language: 'vi', limit: '5', type: 'item' })).search?.map((x) => x.id) ?? [];
  if (!candidates.length) return null;
  const r = await getJson(WIKIDATA, { action: 'wbgetentities', ids: candidates.join('|'), props: 'claims|labels|aliases', languages: 'vi|en' });
  for (const id of candidates) {
    const e = r.entities?.[id];
    const c = e?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (!e) continue;
    if (qid || (c && place.lat != null && haversineKm({ lat: c.latitude, lon: c.longitude }, place) <= 3)) return { id, ...e };
  }
  return null;
}

/** Khoảng cách chim bay (km). */
function haversineKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Danh sách tên tệp ứng viên theo từng tầng nguồn (tầng càng cao càng đáng tin). */
async function gatherTitles(place, entity, region) {
  const found = new Map(); // title -> tầng cao nhất
  const add = (titles, tier) => titles.forEach((t) => { const k = t.replace(/^(Tệp|File|Hình|Image):/i, 'File:'); if (!found.has(k) || found.get(k) < TIER[tier]) found.set(k, TIER[tier]); });
  add((entity?.claims?.P18 ?? []).map((c) => `File:${c.mainsnak?.datavalue?.value}`), 'p18');
  const cat = entity?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
  if (cat) add(((await getJson(COMMONS, { action: 'query', list: 'categorymembers', cmtitle: `Category:${cat}`, cmtype: 'file', cmlimit: '60' })).query?.categorymembers ?? []).map((m) => m.title), 'category');
  const { names, withRegion } = nameVariants(place, entity, region);
  // thêm biến thể không dấu: nhiều tệp Commons đặt tên không dấu hoặc kiểu Anh
  const folded = names.map((n) => fold(n).replace(/s+/g, ' ').trim());
  for (const q of [...new Set([...names, ...withRegion, ...folded])].slice(0, 9)) {
    const r = await getJson(COMMONS, { action: 'query', list: 'search', srsearch: `"${q}" filetype:bitmap`, srnamespace: '6', srlimit: '20' });
    add((r.query?.search ?? []).map((x) => x.title), 'search');
  }
  if (place.lat != null && place.lon != null) {
    const g = await getJson(COMMONS, { action: 'query', list: 'geosearch', gscoord: `${place.lat}|${place.lon}`, gsradius: String(GEO_RADIUS_M), gsnamespace: '6', gslimit: '30' });
    add((g.query?.geosearch ?? []).map((x) => x.title), 'geo');
  }
  return found;
}

/** Thông tin kỹ thuật + giấy phép của các tệp, đã lọc cứng (raster, đủ lớn, giấy phép mở, không nhiễu). */
async function inspectFiles(titles) {
  const names = [...titles.keys()].filter((t) => !NOISE.test(t));
  const out = [];
  for (let i = 0; i < names.length; i += 20) {
    const batch = names.slice(i, i + 20);
    const r = await getJson(COMMONS, { action: 'query', titles: batch.join('|'), prop: 'imageinfo|categories', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(SHEET_WIDTH), iiextmetadatafilter: 'LicenseShortName|Artist|Credit|ImageDescription|DateTimeOriginal', cllimit: 'max' });
    for (const page of r.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (!info || !RASTER_MIME.has(info.mime)) continue;
      const license = plain(info.extmetadata?.LicenseShortName?.value);
      if (!OK_LICENSE.test(license) || BAD_LICENSE.test(license)) continue;
      if (Math.min(info.width, info.height) < MIN_SIDE || Math.max(info.width, info.height) < MIN_LONG_SIDE) continue;
      out.push({
        title: page.title, tier: titles.get(page.title) ?? 0, width: info.width, height: info.height, mime: info.mime, license,
        author: plain(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value).slice(0, AUTHOR_MAX) || 'Wikimedia Commons',
        date: plain(info.extmetadata?.DateTimeOriginal?.value).slice(0, 10), description: plain(info.extmetadata?.ImageDescription?.value).slice(0, 220),
        categories: (page.categories ?? []).map((c) => c.title.replace(/^(Category|Thể loại):/, '')), page: info.descriptionurl, thumb: info.thumburl ?? info.url,
      });
    }
  }
  return out;
}

/** Hướng ảnh: dọc hợp thẻ quẹt, ngang hợp cover; vuông dùng được cho cả hai sau khi cắt. */
function orientation(c) {
  return c.width >= c.height * LANDSCAPE ? 'ngang' : c.height >= c.width * LANDSCAPE ? 'dọc' : 'vuông';
}

/** Điểm xếp hạng: tầng nguồn + khớp tên trong tên tệp/mô tả/danh mục + độ phân giải; ảnh geo cần xem tay nên điểm thấp. */
function score(c, wanted) {
  const hay = fold(`${c.title} ${c.description} ${c.categories.join(' ')}`);
  const titleHay = fold(c.title);
  const hits = wanted.filter((w) => hay.includes(w)).length;
  const inTitle = wanted.filter((w) => titleHay.includes(w)).length;
  const ratio = wanted.length ? hits / wanted.length : 0;
  return Math.round(c.tier + ratio * 40 + (inTitle ? 15 : 0) + Math.min(10, Math.max(c.width, c.height) / 400));
}

/** Gần như cùng một ảnh (cùng tác giả, cùng ngày chụp, tên tệp na ná): chỉ giữ ảnh điểm cao hơn. */
function dedupe(list) {
  const kept = [];
  for (const c of list) {
    const twin = kept.find((k) => k.author === c.author && c.date && k.date === c.date && fold(k.title).slice(0, 18) === fold(c.title).slice(0, 18));
    if (!twin) kept.push(c);
  }
  return kept;
}

/** Tìm ứng viên cho từng địa điểm; ghi docs/research/photo-candidates/<dest>.json. Không đụng tới catalog. */
async function candidates() {
  const catalog = readCatalog();
  const region = catalog.name;
  const result = { dest: DEST, fetchedAt: new Date().toISOString(), places: {} };
  for (const place of catalog.places) {
    if (ONLY_PLACE && place.id !== ONLY_PLACE) continue;
    const want = place.verdict === 'must' ? WANT_MUST : 1;
    const entity = await findEntity(place, region).catch(() => null);
    const titles = await gatherTitles(place, entity, region);
    const wanted = [...new Set(nameVariants(place, entity, region).names.flatMap(tokens))].filter((w) => w.length > MIN_NAME_TOKEN);
    const files = dedupe((await inspectFiles(titles)).map((c) => ({ ...c, orientation: orientation(c), score: score(c, wanted) })).sort((a, b) => b.score - a.score)).slice(0, PER_PLACE_LIMIT);
    result.places[place.id] = { name: place.name, have: place.photos.length, want, qid: entity?.id ?? null, candidates: files };
    console.log(`${place.id}: có ${place.photos.length}/${want}, ${files.length} ứng viên (P18/danh mục/tìm/geo)${entity ? `, ${entity.id}` : ', không tìm thấy mục Wikidata'}`);
  }
  fs.mkdirSync(WORK_DIR, { recursive: true });
  fs.writeFileSync(path.join(WORK_DIR, `${DEST}.json`), JSON.stringify(result, null, 1));
}

/** Escape HTML. */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Contact sheet HTML: mỗi địa điểm một hàng ảnh nhỏ kèm số thứ tự, tầng nguồn, hướng, kích thước, giấy phép để XEM trực tiếp. */
function sheet() {
  const data = JSON.parse(fs.readFileSync(path.join(WORK_DIR, `${DEST}.json`), 'utf8'));
  const sections = Object.entries(data.places).map(([id, p]) => `<section><h2>${esc(p.name)} <small>(${esc(id)}) · có ${p.have}, cần ~${p.want} · ${esc(p.qid ?? 'không có mục Wikidata')}</small></h2><div class="row">${p.candidates.map((c, i) => `<figure><img loading="eager" src="${esc(c.thumb)}" alt=""><figcaption><b>#${i + 1}</b> ${esc(c.orientation)} ${c.width}×${c.height} · điểm ${c.score} · nguồn ${c.tier >= TIER.p18 ? 'P18' : c.tier >= TIER.category ? 'danh mục' : c.tier >= TIER.search ? 'tìm tên' : 'GEO (cần xem)'}<br>${esc(c.license)} · ${esc(c.author.slice(0, 40))}<br><small>${esc(c.title.replace('File:', '').slice(0, 60))}</small></figcaption></figure>`).join('') || '<p>Không có ứng viên đạt chuẩn.</p>'}</div></section>`).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>Ảnh ứng viên ${esc(DEST)}</title><style>body{font:13px system-ui;margin:12px;background:#fff;color:#111}h2{margin:18px 0 6px;font-size:16px}h2 small{color:#666;font-weight:400}.row{display:flex;flex-wrap:wrap;gap:8px}figure{margin:0;width:${SHEET_WIDTH / 2}px}img{width:${SHEET_WIDTH / 2}px;height:${Math.round(SHEET_WIDTH / 2 * 0.75)}px;object-fit:cover;background:#ddd}figcaption{font-size:11px;line-height:1.35}</style><h1>Ứng viên ảnh · ${esc(DEST)} · ${esc(data.fetchedAt)}</h1><p>Ảnh gần tọa độ (GEO) chưa chắc là ảnh của chính địa điểm: phải xem và duyệt tay.</p>${sections}`;
  fs.writeFileSync(path.join(WORK_DIR, `${DEST}.html`), html);
  console.log(`contact sheet → docs/research/photo-candidates/${DEST}.html`);
}

/** Giới hạn số ảnh mỗi địa điểm của backend (đọc từ mã để không lệch). */
function backendPhotoLimit() {
  const src = fs.readFileSync(path.join(ROOT, 'backend/src/main/java/com/wander/catalog/domain/constant/CatalogConstants.java'), 'utf8');
  return Number(/MAX_PHOTOS_PER_PLACE\s*=\s*(\d+)/.exec(src)?.[1] ?? 3);
}

/** Chỉ THÊM ảnh đã duyệt vào catalog: không xóa/ghi đè ảnh và nội dung biên tập có sẵn; bỏ qua tệp đã có (theo liên kết nguồn). */
async function apply() {
  const catalogPath = path.join(CATALOG_DIR, `${DEST}.json`);
  const catalog = readCatalog();
  const curation = JSON.parse(fs.readFileSync(path.join(WORK_DIR, `${DEST}.curation.json`), 'utf8'));
  const limit = backendPhotoLimit();
  let added = 0;
  for (const place of catalog.places) {
    const pick = curation.places?.[place.id];
    if (!pick?.files?.length) continue;
    const r = await getJson(COMMONS, { action: 'query', titles: pick.files.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(DOWNLOAD_WIDTH), iiextmetadatafilter: 'LicenseShortName|Artist|Credit' });
    const info = new Map((r.query?.pages ?? []).map((p) => [p.title, p.imageinfo?.[0]]));
    for (const title of pick.files) {
      const i = info.get(title);
      const license = plain(i?.extmetadata?.LicenseShortName?.value);
      if (!i || !RASTER_MIME.has(i.mime) || !OK_LICENSE.test(license) || BAD_LICENSE.test(license)) { console.log(`  ✗ ${place.id}: ${title} không đạt điều kiện sử dụng`); continue; }
      if (place.photos.some((p) => p.sourceUrl === i.descriptionurl)) continue;
      if (place.photos.length >= limit) { console.log(`  ! ${place.id}: đã đủ ${limit} ảnh (giới hạn backend), bỏ ${title}`); continue; }
      let n = place.photos.length + 1;
      let file = `${place.id}-${n}.${MIME_EXT[i.mime]}`;
      while (fs.existsSync(path.join(PHOTO_DIR, file))) { n += 1; file = `${place.id}-${n}.${MIME_EXT[i.mime]}`; }
      fs.writeFileSync(path.join(PHOTO_DIR, file), await getBytes(i.thumburl ?? i.url));
      place.photos.push({ file, author: plain(i.extmetadata?.Artist?.value || i.extmetadata?.Credit?.value).slice(0, AUTHOR_MAX) || 'Wikimedia Commons', license, sourceUrl: i.descriptionurl });
      added += 1;
      console.log(`  ✓ ${place.id}: + ${file} (${license})`);
    }
  }
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Đã thêm ${added} ảnh vào catalog/${DEST}.json (không xóa/ghi đè ảnh hay nội dung có sẵn)`);
}

const COMMANDS = { candidates, sheet, apply };
if (!COMMANDS[COMMAND]) {
  console.error('Dùng: photo-pipeline.mjs <candidates|sheet|apply> --dest=<mã>');
  process.exit(1);
}
await COMMANDS[COMMAND]();
