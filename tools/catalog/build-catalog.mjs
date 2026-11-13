// Dựng tệp catalog của MỘT điểm đến từ danh sách biên tập (seed) + dữ liệu mở. Chạy khi chuẩn bị dữ liệu, không chạy ở máy người dùng.
//   node tools/catalog/build-catalog.mjs --dest=da-lat [--refresh]
// Nguồn (ADR-009): Wikipedia tiếng Việt (mô tả, tọa độ, ảnh đầu bài), Wikimedia Commons (ảnh, giấy phép, tác giả).
// Chỉ nhận ảnh JPEG giấy phép CC BY / CC BY-SA / CC0 / Public domain, rộng ≥ MIN_WIDTH; KHÔNG nhận NC/ND/độc quyền.
// Đầu ra: backend/src/main/resources/catalog/<dest>.json và catalog/photos/<mã-địa-điểm>-<n>.jpg (ảnh đã có thì dùng lại, --refresh để tải lại).
// Nội dung biên tập trong seed (hook, mẹo, nhãn "nên đi") là BẢN NHÁP chờ PO duyệt; script không bịa dữ kiện (giờ mở cửa, giá vé).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const OUT_DIR = path.join(ROOT, 'backend/src/main/resources/catalog');
const PHOTO_DIR = path.join(OUT_DIR, 'photos');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const REFRESH = process.argv.includes('--refresh');
const DEST = arg('dest', '');
const APPEND_ONLY = process.argv.includes('--append-only');

const UA = 'WanderCatalog/0.1 (learning project; contact https://github.com/dungv798/Wander)';
const VI = 'https://vi.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA = 'https://www.wikidata.org/w/api.php';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const MAX_KM_FROM_REF = 60;
const MIN_WIDTH = 1000;
const THUMB_WIDTH = 1000;
const MAX_PHOTOS = 3;
const SUMMARY_MAX = 520;
const AUTHOR_MAX = 100;
const GAP_MS = 350;
const OK_LICENSE = /^(CC BY(-SA)? \d(\.\d)?|CC0|Public domain|PD)/i;
const BAD_LICENSE = /(-NC|-ND|non-?commercial|no derivatives|fair use)/i;
const NOISE_FILE = /(icon|logo|flag|cờ|map|bản đồ|symbol|commons-|edit-|ambox|question|wiki|locator|diagram|sơ đồ|stub|\.svg|\.png|\.gif)/i;

/** Nguồn ảnh đã ghi trong tệp catalog lần dựng trước: tên tệp ảnh → liên kết gốc (để biết tệp trên đĩa còn đúng không). */
function previousSources() {
  try {
    const old = JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${DEST}.json`), 'utf8'));
    return new Map(old.places.flatMap((pl) => pl.photos.map((ph) => [ph.file, ph.sourceUrl])));
  } catch {
    return new Map();
  }
}
const PREVIOUS = previousSources();

/** Địa điểm của lần dựng trước theo mã (DR-033): ảnh đã tuyển và địa điểm đã có KHÔNG bị ghi đè hay làm mất khi dựng lại. */
function previousPlaces() {
  try {
    return new Map(JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${DEST}.json`), 'utf8')).places.map((p) => [p.id, p]));
  } catch {
    return new Map();
  }
}
const OLD_PLACES = previousPlaces();

/** Giá trị mặc định theo loại địa điểm cho trường biên tập không ghi trong seed (buổi nên đi, lý do, mẹo chung). */
const DEFAULTS = {
  canh: { slots: ['sang', 'chieu'], slotReason: 'Ánh sáng buổi sáng và chiều muộn đẹp, tránh nắng gắt buổi trưa.', tips: ['Mang nước, mũ nón và kem chống nắng.', 'Xem dự báo thời tiết trước khi đi.'] },
  van: { slots: ['sang', 'chieu'], slotReason: 'Buổi sáng hoặc chiều mát đi tham quan thoải mái hơn, ít đông.', tips: ['Ăn mặc lịch sự khi vào nơi thờ tự.', 'Hỏi giờ mở cửa và giá vé tại chỗ trước khi đến.'] },
  am: { slots: ['trua', 'toi'], slotReason: 'Hợp ăn vào bữa trưa hoặc tối, giờ cao điểm thường đông.', tips: ['Hỏi giá trước khi gọi món.', 'Đi sớm hơn giờ cao điểm để khỏi chờ.'] },
  leo: { slots: ['sang'], slotReason: 'Khởi hành sáng sớm để có thời tiết mát và thời gian dư dả.', tips: ['Mang đủ nước và giày bám tốt.', 'Xem dự báo thời tiết, tránh đi khi mưa lớn.'] },
  luu: { slots: ['chieu', 'toi'], slotReason: 'Nhận phòng vào chiều và nghỉ ngơi buổi tối.', tips: ['Đặt phòng sớm vào mùa cao điểm.', 'Đọc kỹ chính sách hủy phòng.'] },
  cho: { slots: ['sang'], slotReason: 'Buổi sáng chợ đông, hàng tươi và nhiều lựa chọn nhất.', tips: ['Hỏi giá trước khi mua.', 'Giữ kỹ đồ cá nhân ở nơi đông người.'] },
};
const DEFAULT_DIFFICULTY = 'Dễ';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch kèm User-Agent; lỗi mạng (hết giờ, đứt kết nối) trả null để người gọi thử lại. */
async function politeFetch(url) {
  try {
    return await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  } catch {
    return null;
  }
}

/** GET JSON có thử lại; nghỉ GAP_MS giữa các lần để lịch sự với máy chủ Wikimedia. */
async function getJson(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    await sleep(GAP_MS);
    const res = await politeFetch(url);
    if (res?.ok) return res.json();
    if (res && res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(4000 * attempt);
  }
  throw new Error(`hết lượt thử ${url}`);
}

/** Tải nhị phân có thử lại. */
async function getBytes(url) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    await sleep(GAP_MS);
    const res = await politeFetch(url);
    if (res?.ok) return Buffer.from(await res.arrayBuffer());
    if (res && res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(4000 * attempt);
  }
  throw new Error(`hết lượt thử ${url}`);
}

/** Bỏ thẻ HTML và khoảng trắng thừa của trường "Artist" trên Commons. */
function plain(html) {
  return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
}

/** Cắt đoạn mô tả ở ranh giới câu, không dài quá SUMMARY_MAX. */
function clip(text) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').replace(/\s*\([^()]*\)/g, '').trim();
  if (clean.length <= SUMMARY_MAX) return clean;
  const cut = clean.slice(0, SUMMARY_MAX);
  const dot = cut.lastIndexOf('. ');
  return dot > SUMMARY_MAX / 2 ? cut.slice(0, dot + 1) : `${cut.trimEnd()}…`;
}

/** Nhãn tháng nên đi từ danh sách tháng: "Tháng 9–11" nếu liền nhau, ngược lại "Tháng 12, 1–2". */
function monthLabel(months) {
  if (!months.length) return 'Xem thời tiết trước khi đi';
  const m = [...new Set(months)].sort((a, b) => a - b);
  if (m.length === 12) return 'Quanh năm';
  const runs = [];
  for (const x of m) {
    const last = runs[runs.length - 1];
    if (last && x === last[1] + 1) last[1] = x;
    else runs.push([x, x]);
  }
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) {
    const tail = runs.pop();
    runs[0][0] = tail[0];
  }
  return `Tháng ${runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ')}`;
}

/** Thông tin một bài Wikipedia: mô tả đầu bài, tọa độ, ảnh đầu bài và danh sách ảnh trong bài. */
async function wikiPage(title) {
  const r = await getJson(VI, {
    action: 'query', redirects: '1', titles: title, prop: 'coordinates|extracts|pageimages|images|pageprops',
    exintro: '1', explaintext: '1', exsentences: '4', piprop: 'name', imlimit: '60', ppprop: 'wikibase_item|disambiguation',
  });
  const page = r.query?.pages?.[0];
  if (!page || page.missing) return null;
  return {
    title: page.title,
    extract: page.extract ?? '',
    lat: page.coordinates?.[0]?.lat ?? null,
    lon: page.coordinates?.[0]?.lon ?? null,
    lead: page.pageimage ?? null,
    images: (page.images ?? []).map((i) => i.title),
    qid: page.pageprops?.wikibase_item ?? null,
    disambiguation: page.pageprops?.disambiguation !== undefined,
  };
}

/** Wikidata: tọa độ (P625), ảnh chính (P18) và danh mục Commons (P373) của một mục. */
async function wikidata(qid) {
  if (!qid) return { lat: null, lon: null, images: [], category: null, viTitle: null };
  const r = await getJson(WIKIDATA, { action: 'wbgetentities', ids: qid, props: 'claims|sitelinks' });
  const claims = r.entities?.[qid]?.claims ?? {};
  const val = (c) => c?.[0]?.mainsnak?.datavalue?.value;
  const coord = val(claims.P625);
  return {
    lat: coord?.latitude ?? null,
    lon: coord?.longitude ?? null,
    images: (claims.P18 ?? []).map((c) => `File:${c.mainsnak?.datavalue?.value}`),
    category: val(claims.P373) ?? null,
    viTitle: r.entities?.[qid]?.sitelinks?.viwiki?.title ?? null,
  };
}

/** Tệp trong một danh mục Commons (ảnh của chính địa điểm). */
async function commonsCategory(name) {
  if (!name) return [];
  const r = await getJson(COMMONS, { action: 'query', list: 'categorymembers', cmtitle: `Category:${name}`, cmtype: 'file', cmlimit: '40' });
  return (r.query?.categorymembers ?? []).map((m) => m.title);
}

/** Khoảng cách đường chim bay (km) giữa hai tọa độ. */
function km(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Tọa độ dự phòng từ Nominatim (OSM, ODbL); chỉ nhận kết quả gần mốc tham chiếu của điểm đến. */
async function nominatim(query, ref) {
  const url = `${NOMINATIM}?${new URLSearchParams({ q: query, format: 'jsonv2', limit: '3', countrycodes: 'vn' })}`;
  await sleep(1100);
  const res = await politeFetch(url);
  if (!res?.ok) return null;
  const hits = (await res.json()).map((h) => ({ lat: Number(h.lat), lon: Number(h.lon) }));
  return hits.find((h) => km(h, ref) <= MAX_KM_FROM_REF) ?? null;
}

/** Tệp Commons gần một tọa độ (dự phòng khi bài không có ảnh dùng được). */
async function commonsNear(lat, lon) {
  const r = await getJson(COMMONS, { action: 'query', list: 'geosearch', gscoord: `${lat}|${lon}`, gsradius: '700', gsnamespace: '6', gslimit: '25' });
  return (r.query?.geosearch ?? []).map((g) => g.title);
}

/** Ảnh đạt chuẩn (JPEG, đủ rộng, giấy phép mở) trong danh sách tên tệp, theo đúng thứ tự đầu vào. */
async function usableImages(titles) {
  const names = titles.map((t) => t.replace(/^(Tập tin|Tệp|File|Hình|Image):/i, 'File:')).filter((t) => !NOISE_FILE.test(t));
  const found = [];
  for (let i = 0; i < names.length; i += 20) {
    const batch = names.slice(i, i + 20);
    const r = await getJson(COMMONS, {
      action: 'query', titles: batch.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(THUMB_WIDTH),
      iiextmetadatafilter: 'LicenseShortName|Artist|Credit',
    });
    const byTitle = new Map((r.query?.pages ?? []).map((p) => [p.title, p]));
    for (const t of batch) {
      const info = byTitle.get(t)?.imageinfo?.[0] ?? byTitle.get(t.replace(/_/g, ' '))?.imageinfo?.[0];
      if (!info || info.mime !== 'image/jpeg' || info.width < MIN_WIDTH || info.width < info.height * 0.8) continue;
      const license = plain(info.extmetadata?.LicenseShortName?.value);
      if (!OK_LICENSE.test(license) || BAD_LICENSE.test(license)) continue;
      const author = plain(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value).slice(0, AUTHOR_MAX) || 'Wikimedia Commons';
      found.push({ title: t, url: info.thumburl ?? info.url, license, author, source: info.descriptionurl });
    }
  }
  return found;
}

/** Chọn và tải tối đa MAX_PHOTOS ảnh (hoặc đúng các vị trí `keep` đã duyệt) cho một địa điểm; trả danh sách `photos` theo khuôn catalog. */
async function photosFor(id, page, wd, lat, lon, keep) {
  const lead = page?.lead ? [`File:${page.lead}`] : [];
  const first = [...lead, ...wd.images];
  const rest = (page?.images ?? []).filter((t) => !first.includes(t.replace(/^(Tệp|File):/i, 'File:')));
  let picks = await usableImages([...first, ...rest]);
  if (picks.length < 2) {
    const have = new Set(picks.map((p) => p.title));
    picks = picks.concat((await usableImages(await commonsCategory(wd.category))).filter((p) => !have.has(p.title)));
  }
  // Không tự gắn ảnh "gần tọa độ" (DR-033): ảnh chụp gần một điểm chưa chắc là ảnh của chính điểm đó. Ảnh theo tọa độ chỉ là ứng viên
  // trong photo-pipeline.mjs, phải được xem và duyệt.
  picks = [...new Map(picks.map((pick) => [pick.source, pick])).values()]; // cùng một tệp Commons có thể đến từ nhiều nguồn
  // người biên tập đã xem từng ảnh: chỉ giữ các vị trí (từ 1) được duyệt; [] nghĩa là không ảnh nào đạt nên bỏ địa điểm
  if (keep) picks = keep.map((n) => picks[n - 1]).filter(Boolean);
  const photos = [];
  for (const [n, p] of picks.slice(0, MAX_PHOTOS).entries()) {
    const file = `${id}-${n + 1}.jpg`;
    const target = path.join(PHOTO_DIR, file);
    const same = PREVIOUS.get(file) === p.source && fs.existsSync(target);
    if (REFRESH || !same) fs.writeFileSync(target, await getBytes(p.url));
    photos.push({ file, author: p.author, license: p.license, sourceUrl: p.source });
  }
  for (const old of fs.readdirSync(PHOTO_DIR)) {
    const m = old.match(new RegExp(`^${id}-(\\d+)\\.jpg$`));
    if (m && Number(m[1]) > photos.length) fs.unlinkSync(path.join(PHOTO_DIR, old));
  }
  return photos;
}

/** Các tiêu đề Wikipedia ứng viên cho một cụm từ tìm kiếm. */
async function searchTitles(text) {
  const r = await getJson(VI, { action: 'query', list: 'search', srsearch: text, srlimit: '5' });
  return (r.query?.search ?? []).map((x) => x.title);
}

/** Tách chữ thường không dấu để so tên (bỏ từ nối quá chung). */
function words(text) {
  const stop = new Set(['cua', 'va', 'thanh', 'pho', 'khu', 'di', 'tich']);
  const plain = String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  return new Set(plain.split(/[^a-z0-9]+/).filter((w) => w && !stop.has(w)));
}

/** Hai tên giống nhau đủ để coi là cùng một nơi (≥ 60% từ của tên ngắn hơn có ở tên kia). */
function similar(a, b, min = 0.75) {
  const [x, y] = [words(a), words(b)];
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared / Math.max(1, x.size, y.size) >= min;
}

/**
 * Tiêu đề bài (sau khi đã theo chuyển hướng) có đúng là địa điểm của seed không: giống tiêu đề Wikipedia trong seed hoặc tên hiển thị
 * (bỏ phần trong ngoặc). Chặn trường hợp chuyển hướng sang trang rộng hơn, ví dụ "Ghềnh Ráng" → phường "Quy Nhơn Nam".
 */
function matchesSeed(title, seed, min = 0.75) {
  const bare = (text) => String(text).replace(/\s*\(.*?\)/g, '').trim();
  return similar(bare(title), bare(seed.wiki), min) || similar(bare(title), bare(seed.name ?? seed.wiki), min);
}

/** Mục Wikidata có nhãn tiếng Việt khớp cụm tìm kiếm (dự phòng khi Wikipedia tiếng Việt chưa có bài). */
async function wikidataCandidates(text) {
  const r = await getJson(WIKIDATA, { action: 'wbsearchentities', search: text, language: 'vi', uselang: 'vi', type: 'item', limit: '6' });
  return (r.search ?? []).map((x) => ({ qid: x.id, label: x.label ?? '' }));
}

/** Tọa độ của một bài (Wikipedia rồi Wikidata); null nếu không có. */
function pageCoord(page, wd) {
  if (page.lat != null) return { lat: page.lat, lon: page.lon, from: 'wikipedia' };
  if (wd.lat != null) return { lat: wd.lat, lon: wd.lon, from: 'wikidata' };
  return null;
}

/**
 * Tìm bài Wikipedia đúng của một địa điểm: thử tiêu đề trong seed rồi các kết quả tìm kiếm (tên phải giống đủ).
 * Chỉ nhận bài có tọa độ trong bán kính MAX_KM_FROM_REF quanh điểm đến; trang định hướng bị bỏ.
 */
async function resolvePage(seed, ref) {
  const label = seed.name ?? seed.wiki;
  const found = [seed.wiki, ...(await searchTitles(`${label} ${ref.dest}`))];
  const seen = new Set();
  for (const title of found) {
    if (seen.has(title)) continue;
    seen.add(title);
    if (!matchesSeed(title, seed)) continue;
    const page = await wikiPage(title);
    if (!page || page.disambiguation || !matchesSeed(page.title, seed, 0.5)) continue; // kiểm cả tiêu đề SAU chuyển hướng
    const wd = await wikidata(page.qid);
    const coord = pageCoord(page, wd) ?? (await overpassCoord(label, ref));
    if (coord && km(coord, ref) <= radiusOf(ref)) return { page, wd, coord };
  }
  const viaWikidata = await resolveViaWikidata(label.replace(/\s*\(.*\)/, ''), ref);
  if (viaWikidata) return viaWikidata;
  // Tên OSM khác tên biên tập (thường là tiếng Anh hoặc không dấu): seed khai báo osmAliases theo mã địa điểm.
  const names = [label.replace(/\s*\(.*\)/, ''), ...(ref.osmAliases?.[seed.id] ?? [])];
  const osm = names.map((n) => osmProbeCoord(n, ref)).find(Boolean);
  return osm ? { page: { title: label.replace(/\s*\(.*\)/, ''), extract: '', lat: null, lon: null, lead: null, images: [], qid: null, noWikipedia: true }, wd: { images: [], category: null }, coord: osm } : null;
}

/** Ứng viên OSM đã khảo sát (probe-osm-candidates.mjs, ODbL); nguồn tọa độ cho nơi không có bài Wikipedia (DR-033, D-A). Vị trí = OSM_UNVERIFIED. */
const OSM_PROBE = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/catalog/data/osm-candidates', `${DEST}.json`), 'utf8')).places;
  } catch {
    return [];
  }
})();

/** Tọa độ từ ứng viên OSM có tên giống `label` (giống đủ từ), gần mốc điểm đến nhất; null nếu không có. */
function osmProbeCoord(label, ref) {
  const hits = OSM_PROBE.filter((p) => similar(p.name, label, 0.75) && km(p, ref) <= radiusOf(ref)).sort((a, b) => km(a, ref) - km(b, ref));
  return hits[0] ? { lat: hits[0].lat, lon: hits[0].lon, from: 'osm-probe' } : null;
}

/** Bán kính (km) quanh điểm đến mà địa điểm phải nằm trong: riêng từng điểm đến (seed.radiusKm) hoặc mặc định. */
function radiusOf(ref) {
  return ref.radiusKm ?? MAX_KM_FROM_REF;
}

/** Tọa độ dự phòng từ OpenStreetMap (Overpass, ODbL): đối tượng có tên giống `label` trong bán kính điểm đến, gần mốc nhất. */
async function overpassCoord(label, ref) {
  const safe = label.replace(/[^\p{L}\p{N} ]/gu, '').trim();
  if (!safe) return null;
  const query = `[out:json][timeout:40];nwr["name"~"${safe}",i](around:${radiusOf(ref) * 1000},${ref.lat},${ref.lon});out center 8;`;
  await sleep(GAP_MS * 3);
  const res = await fetch(OVERPASS, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}`, signal: AbortSignal.timeout(60000) }).catch(() => null);
  if (!res?.ok) return null;
  const hits = ((await res.json()).elements ?? [])
    .map((e) => ({ name: e.tags?.name ?? '', lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon }))
    .filter((h) => h.lat != null && similar(h.name, label))
    .sort((a, b) => km(a, ref) - km(b, ref));
  return hits[0] ? { lat: hits[0].lat, lon: hits[0].lon, from: 'osm' } : null;
}

/**
 * Dự phòng: tìm mục Wikidata cùng tên; tọa độ từ Wikidata hoặc OSM. Dùng bài tiếng Việt liên kết với mục NẾU tiêu đề giống tên địa điểm
 * (tránh bài của phường/huyện chứa địa danh), ngược lại để trống mô tả.
 */
async function resolveViaWikidata(label, ref) {
  for (const cand of await wikidataCandidates(label)) {
    if (!similar(cand.label, label)) continue;
    const wd = await wikidata(cand.qid);
    const coord = wd.lat != null ? { lat: wd.lat, lon: wd.lon, from: 'wikidata' } : await overpassCoord(label, ref);
    if (!coord || km(coord, ref) > radiusOf(ref)) continue;
    const candidate = wd.viTitle && similar(wd.viTitle.replace(/\s*\(.*?\)/g, ''), label) ? await wikiPage(wd.viTitle) : null;
    // bài sau chuyển hướng phải vẫn là địa điểm này (không phải phường/huyện chứa nó)
    const viPage = candidate && similar(candidate.title.replace(/\s*\(.*?\)/g, ''), label, 0.5) ? candidate : null;
    const page = viPage ?? { title: cand.label, extract: '', lat: null, lon: null, lead: null, images: [], qid: cand.qid, disambiguation: false };
    return { page: { ...page, noWikipedia: !viPage }, wd, coord };
  }
  return null;
}

/** Dựng một địa điểm: nội dung biên tập từ seed + dữ liệu mở. Trả null và in lý do nếu thiếu dữ kiện bắt buộc. */
async function buildPlace(seed, ref) {
  const found = await resolvePage(seed, ref);
  if (!found) return console.log(`  ✗ ${seed.id}: không tìm được bài Wikipedia khớp "${seed.wiki}" có tọa độ gần điểm đến`);
  const { page, wd, coord } = found;
  const { lat, lon } = coord;
  // Tách dựng địa điểm khỏi tìm ảnh (DR-033): ảnh đã có trong catalog được giữ nguyên; chưa có thì thử tìm; vẫn không có thì nhập địa điểm
  // với photos rỗng (đã đủ tọa độ) và để pipeline ảnh (photo-pipeline.mjs) bổ sung sau.
  const kept = OLD_PLACES.get(seed.id)?.photos ?? [];
  const osmOnly = coord.from === 'osm-probe' || coord.from === 'osm';
  const photos = kept.length ? kept : osmOnly ? [] : await photosFor(seed.id, page, wd, lat, lon, seed.keepPhotos);
  console.log(`  ✓ ${seed.id}: "${page.title}", ${photos.length ? `${photos.length} ảnh${kept.length ? ' (giữ ảnh đã tuyển)' : ''}` : 'CHƯA có ảnh (pipeline ảnh sẽ bổ sung)'}, tọa độ ${coord.from}`);
  return {
    id: seed.id, name: seed.name ?? page.title, category: seed.cat, area: seed.area, hook: seed.hook, summary: seed.summary ?? clip(page.extract),
    lat, lon, bestMonths: seed.months, bestLabel: monthLabel(seed.months), duration: seed.duration, difficulty: seed.difficulty ?? DEFAULT_DIFFICULTY,
    highlights: seed.highlights ?? [], verdict: seed.verdict, verdictReason: seed.verdictReason, bestSlots: seed.slots ?? DEFAULTS[seed.cat].slots, slotReason: seed.slotReason ?? DEFAULTS[seed.cat].slotReason,
    tips: seed.tips ?? DEFAULTS[seed.cat].tips, photos, wikipediaTitle: page.noWikipedia ? null : page.title,
  };
}

/** Điểm đến: thông tin chung + cẩm nang (mùa, chuẩn bị) từ seed + các địa điểm dựng được. */
async function main() {
  if (!DEST) throw new Error('Thiếu --dest=<mã điểm đến>, ví dụ --dest=da-lat');
  const seed = (await import(pathToFileURL(path.join(here, 'seeds', `${DEST}.mjs`)).href)).default;
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  console.log(`Dựng ${seed.name} (${seed.places.length} địa điểm trong seed)`);
  const places = [];
  for (const s of seed.places) {
    if (APPEND_ONLY && OLD_PLACES.has(s.id)) {
      places.push(OLD_PLACES.get(s.id));
      console.log(`  = ${s.id}: giữ nguyên toàn bộ dữ liệu đã có`);
      continue;
    }
    try {
      const p = await buildPlace(s, { dest: seed.name, radiusKm: seed.radiusKm, osmAliases: seed.osmAliases, ...seed.references[0] });
      if (p) places.push(p);
    } catch (e) {
      console.log(`  ✗ ${s.id}: lỗi khi dựng (${String(e.message).slice(0, 90)})`);
    }
  }
  // Địa điểm đã có ở lần dựng trước nhưng lần này không dựng lại được thì GIỮ NGUYÊN (không để dựng lại làm mất dữ liệu).
  for (const [id, old] of OLD_PLACES) {
    if (!places.some((p) => p.id === id)) {
      places.push(old);
      console.log(`  = ${id}: giữ bản đã có trong catalog (lần này không dựng lại được)`);
    }
  }
  if (!places.length) throw new Error('không dựng được địa điểm nào');
  const coverOk = places.some((p) => p.id === seed.coverPlaceId && p.photos.length);
  if (!coverOk) {
    const fallback = places.find((p) => p.photos.length);
    if (!fallback) throw new Error('không địa điểm nào có ảnh để làm bìa điểm đến');
    console.log(`  ! địa điểm bìa "${seed.coverPlaceId}" không có ảnh, tạm dùng "${fallback.id}" (sửa coverPlaceId trong seed)`);
    seed.coverPlaceId = fallback.id;
  }
  const guide = [
    { id: 'mua', layout: 'MONTHS', category: 'canh', icon: 'calendar-event', title: 'Mùa nên đi', summary: seed.season.summary, bestMonths: seed.season.best, rainyMonths: seed.season.rainy, notes: seed.season.notes, items: [] },
    { id: 'chuanbi', layout: 'CHECKLIST', category: 'van', icon: 'backpack', title: 'Chuẩn bị mang gì', summary: seed.packing.summary, items: seed.packing.items.map((title) => ({ icon: 'check', title })) },
  ];
  const out = { id: seed.id, name: seed.name, region: seed.region, tagline: seed.tagline, coverPlaceId: seed.coverPlaceId, references: seed.references, guide, places };
  const target = path.join(OUT_DIR, `${seed.id}.json`);
  const previous = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : null;
  // Dựng lại địa điểm không được xoá bộ khoảnh khắc/bìa đã tuyển. Chế độ bổ sung còn giữ mọi nội dung điểm đến cũ.
  const result = APPEND_ONLY && previous ? { ...previous, places } : {
    ...out,
    ...(previous?.moments ? { moments: previous.moments } : {}),
    ...(previous?.coverPhoto ? { coverPhoto: previous.coverPhoto } : {}),
  };
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Xong: ${places.length}/${seed.places.length} địa điểm → catalog/${seed.id}.json`);
}

export { buildPlace, getJson, getBytes, plain, usableImages, wikiPage };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => {
  console.error(e);
  process.exit(1);
});
