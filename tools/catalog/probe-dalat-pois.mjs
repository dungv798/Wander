// Khảo sát một lần, có cache: POI ăn/uống Đà Lạt và ảnh Commons đúng nguồn.
// Không ghi catalog chính; chạy: node tools/catalog/probe-dalat-pois.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'docs/research/da-lat-poi-trial');
const cache = path.join(root, '.logs/da-lat-poi-trial');
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(path.join(out, 'photos'), { recursive: true });
const ua = 'WanderPOITrial/0.1 (local noncommercial data evaluation)';
const commons = 'https://commons.wikimedia.org/w/api.php';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];

/** Cache theo URL/body, thử lại có giới hạn, không chạy truy vấn public hàng loạt. */
async function json(url, body) {
  const key = createHash('sha256').update(url + (body ?? '')).digest('hex');
  const target = path.join(cache, key + '.json');
  if (fs.existsSync(target)) return JSON.parse(fs.readFileSync(target, 'utf8'));
  for (let attempt = 0; attempt < 2; attempt++) {
    await wait(2200 + attempt * 3000);
    const response = await fetch(url, { method: body ? 'POST' : 'GET', body, headers: { 'User-Agent': ua, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, signal: AbortSignal.timeout(100000) });
    if (!response.ok) {
      if (response.status === 429 && attempt === 0) { console.log('Rate limit: honoring a 60s minimum cooldown.'); await wait(Math.max(60000, Math.min(120000, Number(response.headers.get('retry-after')) * 1000 || 60000))); continue; }
      if (attempt === 1 || response.status < 500) throw new Error(`${response.status} ${url}`);
      continue;
    }
    const value = await response.json();
    if (value.error || value.remark) throw new Error(JSON.stringify(value.error ?? value.remark));
    fs.writeFileSync(target, JSON.stringify(value, null, 2));
    return value;
  }
}

/** API Commons với maxlag và kết quả JSON có metadata attribution nguyên bản. */
const wiki = params => json(commons + '?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', maxlag: '5', ...params }));
const plain = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const normalize = value => String(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();

/** Giữ nguyên OSM id/tags để đối chiếu; polygon dùng center, không coi là cửa vào. */
function poi(element) {
  const tags = element.tags ?? {};
  return { id: `${element.type}/${element.id}`, sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`, name: tags.name ?? tags['name:vi'] ?? null, category: tags.amenity, lat: element.lat ?? element.center?.lat, lon: element.lon ?? element.center?.lon, coordinateKind: element.type === 'node' ? 'point' : 'polygon-center', tags };
}

/** Chỉ nhận giấy phép mở rõ ràng và đủ metadata; điểm kỹ thuật không thay đánh giá mắt người. */
function photo(page, query, linkedId) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const metadata = info.extmetadata ?? {};
  const description = plain(metadata.ImageDescription?.value);
  if (!query.startsWith('Category:') && !/đà lạt|da lat|dalat|lâm đồng|lam dong/i.test(page.title + ' ' + description)) return null;
  const license = plain(metadata.LicenseShortName?.value);
  if (!/^(CC BY(?:-SA)? \d(?:\.\d)?|CC0|Public domain|PD)/i.test(license) || /-NC|-ND|noncommercial|non-commercial/i.test(license)) return null;
  if (!['image/jpeg', 'image/webp', 'image/png'].includes(info.mime) || info.width < 1400 || info.height < 800) return null;
  if (/(logo|icon|map|diagram|flag)/i.test(page.title)) return null;
  const ratio = info.width / info.height;
  const artist = plain(metadata.Artist?.value);
  if (!artist) return null;
  return { title: page.title, sourceUrl: info.descriptionurl, originalUrl: info.url, previewUrl: info.thumburl ?? info.url, width: info.width, height: info.height, license, licenseUrl: metadata.LicenseUrl?.value ?? null, author: artist, credit: plain(metadata.Credit?.value), description: plain(metadata.ImageDescription?.value), query, linkedOsmId: linkedId ?? null, matchStatus: linkedId ? 'candidate-osm-link-needs-manual-confirmation' : 'search-candidate-not-confirmed', technicalScore: (ratio >= 1.25 && ratio <= 2 ? 40 : 5) + Math.min(info.width * info.height / 1000000, 20), rawMetadata: metadata };
}

/** Chạy khảo sát ăn uống tại bbox cố định, không có rating giả hay ảnh minh họa gắn nhầm quán. */
async function main() {
  const bbox = '11.88,108.36,12.02,108.53';
  const query = `[out:json][timeout:65];nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream)$"](${bbox});out center tags;`;
  console.log('Fetching OSM restaurant/cafe POIs for Da Lat bbox:', bbox);
  const raw = await json('https://overpass-api.de/api/interpreter', 'data=' + encodeURIComponent(query));
  const pois = (raw.elements ?? []).map(poi);
  fs.writeFileSync(path.join(out, 'pois.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), osmTimestamp: raw.osm3s?.timestamp_osm_base, bbox, attribution: '© OpenStreetMap contributors', license: 'ODbL-1.0', licenseUrl: 'https://www.openstreetmap.org/copyright', pois }, null, 2));
  const count = predicate => pois.filter(predicate).length;
  const stats = { total: pois.length, byCategory: Object.fromEntries([...new Set(pois.map(p => p.category))].map(type => [type, count(p => p.category === type)])), named: count(p => !!p.name), withAddress: count(p => Object.keys(p.tags).some(key => key.startsWith('addr:'))), withOpeningHours: count(p => !!p.tags.opening_hours), withPhone: count(p => !!(p.tags.phone || p.tags['contact:phone'])), withWebsite: count(p => !!(p.tags.website || p.tags['contact:website'])), withImageTag: count(p => !!(p.tags.image || p.tags.wikimedia_commons)), withWikidata: count(p => !!p.tags.wikidata) };
  console.log('OSM coverage:', JSON.stringify(stats));
  const discovered = [];
  const addPages = (pages, q, id) => { for (const page of pages ?? []) { const candidate = photo(page, q, id); if (candidate) discovered.push(candidate); } };
  const imageParams = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1200' };
  const linked = pois.filter(p => p.tags.wikimedia_commons || p.tags.wikidata || /commons\.wikimedia\.org/i.test(p.tags.image ?? '')).slice(0, 20);
  for (const p of linked) {
    const titles = [];
    const value = p.tags.wikimedia_commons;
    if (value?.startsWith('File:')) titles.push(value);
    if (value?.startsWith('Category:')) {
      const data = await wiki({ generator: 'categorymembers', gcmtitle: value, gcmtype: 'file', gcmlimit: '8', ...imageParams });
      addPages(data.query?.pages, value, p.id);
    }
    if (p.tags.wikidata && /^Q\d+$/.test(p.tags.wikidata)) {
      const wd = await json('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: p.tags.wikidata, props: 'claims', format: 'json' }));
      for (const claim of wd.entities?.[p.tags.wikidata]?.claims?.P18 ?? []) { const file = claim.mainsnak?.datavalue?.value; if (file) titles.push('File:' + file); }
    }
    if (titles.length) addPages((await wiki({ titles: [...new Set(titles)].join('|'), ...imageParams })).query?.pages, p.name, p.id);
  }
  // Danh mục ảnh theo quán đã xác định trên Commons; đối chiếu OSM vẫn phải được người xem xác nhận.
  for (const [category, name] of [['Cafés in Da Lat', null], ['Café Tùng', 'tung'], ['Le Café de la Poste', 'poste'], ['WoodStock Coffee', 'woodstock']]) {
    const match = name ? pois.filter(p => p.name && normalize(p.name).split(/\s+/).includes(name)) : [];
    try {
      console.log('Commons category:', category, 'OSM matches:', match.length);
      const data = await wiki({ generator: 'categorymembers', gcmtitle: 'Category:' + category, gcmtype: 'file', gcmlimit: '60', ...imageParams });
      addPages(data.query?.pages, 'Category:' + category, match.length === 1 ? match[0].id : null);
    } catch (error) { errors.push({ stage: 'category', query: category, error: error.message }); break; }
  }
  const searches = ['"Da Lat" cafe', '"Dalat" coffee', '"Đà Lạt" "cà phê"', '"Da Lat" restaurant', '"Cafe Tung"', '"La Viet" coffee', '"Me Linh" coffee'];
  // Sample 12 distinctive OSM names rather than issuing a search for every POI.
  const stop = /^(cafe|coffee|cà phê|nhà hàng|restaurant|quán ăn|ăn sáng|ăn trưa|ăn tối)$/i;
  const names = pois.filter(p => p.name && p.category === 'cafe' && !stop.test(p.name) && p.name.length > 5).sort((a, b) => Number(!!b.tags.website) - Number(!!a.tags.website)).slice(0, 12);
  for (const p of names) searches.push(`"${p.name.replaceAll('"', '')}" "Da Lat"`);
  for (const q of [...new Set(searches)]) {
    console.log('Commons search:', q);
    try {
      const data = await wiki({ generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '8', ...imageParams });
      addPages(data.query?.pages, q);
    } catch (error) { errors.push({ stage: 'search', query: q, error: error.message }); break; }
  }
  // Ưu tiên bản ghi có nguồn danh mục/quán cụ thể trước các kết quả tìm kiếm trùng ảnh.
  const photos = [...new Map(discovered.reverse().map(p => [p.sourceUrl, p])).values()].sort((a, b) => Number(!!b.linkedOsmId) - Number(!!a.linkedOsmId) || b.technicalScore - a.technicalScore);
  const groups = new Map();
  for (const p of photos) { const group = p.query.startsWith('Category:') ? p.query : 'search'; if (!groups.has(group)) groups.set(group, []); groups.get(group).push(p); }
  const framing = p => p.technicalScore + (/nội thất|ngoại thất|toàn cảnh/i.test(p.title) ? 20 : 0) - (/đồ trang trí|street/i.test(p.title) ? 25 : 0);
  for (const group of groups.values()) group.sort((a, b) => framing(b) - framing(a));
  // Lấy luân phiên để một quán có ảnh độ phân giải lớn không chiếm hết mẫu.
  const order = ['Category:WoodStock Coffee', 'Category:Le Café de la Poste', 'Category:Café Tùng', 'search', 'Category:Cafés in Da Lat'];
  const picks = [];
  for (let round = 0; round < 5 && picks.length < 18; round++) for (const group of order) { const p = groups.get(group)?.[round]; if (p && picks.length < 18) picks.push(p); }
  fs.writeFileSync(path.join(out, 'photo-candidates.json'), JSON.stringify(photos, null, 2));
  for (const p of picks) {
    const ext = p.previewUrl.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i)?.[1]?.toLowerCase() ?? 'jpg';
    p.localFile = `photos/candidate-${createHash('sha256').update(p.sourceUrl).digest('hex').slice(0, 12)}.${ext}`;
    const destination = path.join(out, p.localFile);
    if (!fs.existsSync(destination)) {
      await wait(600);
      console.log('Downloading:', p.title);
      try {
        const response = await fetch(p.previewUrl, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(45000) });
        if (!response.ok) { p.downloadError = response.status; delete p.localFile; continue; }
        if (!/^image\//.test(response.headers.get('content-type') ?? '')) throw new Error('Expected image content');
        fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
      } catch (error) { p.downloadError = error.message; delete p.localFile; }
    }
  }
  fs.writeFileSync(path.join(out, 'photo-candidates.json'), JSON.stringify(photos, null, 2));
  fs.writeFileSync(path.join(out, 'coverage.json'), JSON.stringify({ ...stats, directlyLinkedImagePoisExamined: linked.length, commonsQueries: [...new Set(searches)], qualifiedPhotoCandidates: photos.length, downloadedPhotoCandidates: photos.filter(p => p.localFile).length, errors, note: 'OSM objects, not deduplicated businesses; bbox sample, not city-wide completeness. Candidates are not confirmed venue photos until visual review.' }, null, 2));
  console.log('Photo candidates:', photos.length, 'downloaded:', photos.filter(p => p.localFile).length);
  console.log('Artifacts:', out);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
