// Máy chủ danh mục CHỈ ĐỂ XEM GIAO DIỆN khi backend Java chưa chạy: đọc (chỉ đọc) JSON biên tập thật của backend và dựng lại
// đúng hình dạng `CatalogViews` mà `CatalogQueries` trả. Không phải backend, không ghi gì, không chạm danh tính/chuyến đi.
// Hệ số quãng đường khớp CatalogConstants (ROAD_FACTOR, SPEED_KMH). Khi backend thật chạy thì không dùng tệp này.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const CATALOG_DIR = path.resolve(import.meta.dirname, '../../backend/src/main/resources/catalog');
const PHOTO_PREFIX = '/catalog/photos/';
const ROAD_FACTOR = 1.5;
const SPEED_KMH = 25;
const EARTH_KM = 6371;
const MINUTES_PER_HOUR = 60;
const PREVIEW_COUNT = 3;
const CATEGORY = { canh: 'Cảnh quan', van: 'Văn hóa', am: 'Ẩm thực', leo: 'Leo núi', luu: 'Lưu trú', cho: 'Chợ' };
const VERDICT = { must: 'Nên ghé', worth: 'Đáng đi', ifconv: 'Chỉ ghé nếu tiện' };
const THEME = { cho: 'Chợ & phố', 'mon-an': 'Món ăn', nguoi: 'Con người', 'le-hoi': 'Lễ hội & văn hóa', nghe: 'Nghề & đời sống', 'hanh-trinh': 'Hành trình' };

/** Đường dẫn công khai của một ảnh (tệp cục bộ hoặc địa chỉ ngoài). */
function photoUrl(photo) {
  return photo.externalUrl ?? photo.url ?? `${PHOTO_PREFIX}${photo.file}`;
}

/** Dạng hiển thị của ảnh kèm ghi công. */
function photoView(photo) {
  return { url: photoUrl(photo), author: photo.author ?? '', license: photo.license ?? '', sourceUrl: photo.sourceUrl ?? '' };
}

/** Quãng đường chim bay (km) giữa hai tọa độ. */
function airKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Một mốc tham chiếu → khoảng cách ước tính tới địa điểm. */
function awayView(ref, place) {
  const km = airKm(ref, place) * ROAD_FACTOR;
  return { refId: ref.id, refName: ref.name, km: Math.max(1, Math.round(km)), minutes: Math.round((km / SPEED_KMH) * MINUTES_PER_HOUR), approximate: ref.approximate === true };
}

/** Một địa điểm → PlaceView. */
function placeView(dest, place) {
  const located = typeof place.lat === 'number' && typeof place.lon === 'number';
  return {
    id: place.id, name: place.name, category: place.category, categoryName: CATEGORY[place.category] ?? place.category, area: place.area ?? '',
    hook: place.hook ?? '', summary: place.summary ?? '', lat: located ? place.lat : null, lon: located ? place.lon : null,
    bestMonths: place.bestMonths ?? [], bestLabel: place.bestLabel ?? '', duration: place.duration ?? '', difficulty: place.difficulty ?? '',
    highlights: place.highlights ?? [], verdict: place.verdict, verdictLabel: VERDICT[place.verdict] ?? place.verdict, verdictReason: place.verdictReason ?? '',
    bestSlots: place.bestSlots ?? [], slotReason: place.slotReason ?? '', tips: place.tips ?? [], photos: (place.photos ?? []).map(photoView),
    away: located ? (dest.references ?? []).map((ref) => awayView(ref, place)) : [], wikipediaTitle: place.wikipediaTitle ?? null,
    venue: place.venue ? { ...place.venue, kindName: ({ restaurant: 'Quán ăn', cafe: 'Quán cà phê', bar: 'Quán bar', lodging: 'Chỗ ở' })[place.venue.kind], phone: place.venue.phone ?? '', serviceHours: place.venue.serviceHours ?? '', priceNote: place.venue.priceNote ?? '' } : null,
  };
}

/** Ảnh bìa: ảnh bìa riêng nếu có, không thì ảnh đầu của địa điểm bìa. */
function coverUrl(dest) {
  if (dest.coverPhoto) return photoUrl(dest.coverPhoto);
  const place = dest.places.find((p) => p.id === dest.coverPlaceId) ?? dest.places[0];
  return place?.photos?.[0] ? photoUrl(place.photos[0]) : '';
}

/** Ghi công của đúng ảnh bìa được chọn, cùng hợp đồng additive với backend. */
function coverPhoto(dest) {
  const photo = dest.coverPhoto ?? dest.places.find(p => p.id === dest.coverPlaceId)?.photos?.[0];
  return photo ? photoView(photo) : undefined;
}

/** Điểm đến → DestinationSummary. */
function summaryView(dest) {
  const months = (dest.guide ?? []).find((s) => s.layout === 'MONTHS');
  const located = dest.places.filter((p) => typeof p.lat === 'number' && typeof p.lon === 'number');
  const mean = (key) => (located.length ? located.reduce((sum, p) => sum + p[key], 0) / located.length : null);
  return {
    id: dest.id, name: dest.name, region: dest.region, tagline: dest.tagline, placeCount: dest.places.length, coverUrl: coverUrl(dest), bestMonths: months?.bestMonths ?? [],
    previews: dest.places.filter((p) => (p.photos ?? []).length > 0).slice(0, PREVIEW_COUNT).map((p) => ({ placeId: p.id, name: p.name, url: photoUrl(p.photos[0]) })),
    lat: mean('lat'), lon: mean('lon'), coverPhoto: coverPhoto(dest),
    categories: [...new Set(dest.places.map(p => p.category))].sort(),
  };
}

/** Điểm đến → DestinationDetail. */
function detailView(dest) {
  return {
    id: dest.id, name: dest.name, region: dest.region, tagline: dest.tagline, coverUrl: coverUrl(dest), coverPhoto: coverPhoto(dest),
    references: (dest.references ?? []).map((r) => ({ id: r.id, name: r.name, lat: r.lat, lon: r.lon, approximate: r.approximate === true })),
    guide: (dest.guide ?? []).map((s) => ({
      id: s.id, layout: String(s.layout).toLowerCase(), category: s.category, icon: s.icon, title: s.title, summary: s.summary ?? '', bestMonths: s.bestMonths ?? [], rainyMonths: s.rainyMonths ?? [], notes: s.notes ?? [],
      items: (s.items ?? []).map((i) => ({ icon: i.icon, title: i.title, text: i.text ?? '', placeId: i.placeId ?? null })),
    })),
    places: dest.places.map((p) => placeView(dest, p)),
    moments: (dest.moments ?? []).map((m) => ({ id: m.id, theme: m.theme, themeLabel: THEME[m.theme] ?? m.theme, caption: m.caption, photo: photoView(m) })),
  };
}

/** Nạp mọi điểm đến từ thư mục biên tập (mỗi lần gọi, để thấy ngay khi biên tập đổi). */
function loadAll() {
  return fs.readdirSync(CATALOG_DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, f), 'utf8')));
}

/** Lịch mẫu của một điểm đến (rỗng khi chưa có tệp), đúng hình dạng `TemplateView`. */
function templatesOf(destinationId) {
  const file = path.join(CATALOG_DIR, 'templates', `${destinationId}.json`);
  if (!path.resolve(file).startsWith(path.join(CATALOG_DIR, 'templates') + path.sep) || !fs.existsSync(file)) return [];
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (doc.templates ?? []).map((t) => ({ id: t.id, title: t.title, summary: t.summary ?? '', status: t.status, days: (t.days ?? []).map((d) => ({ placeIds: d.places ?? [], note: d.note ?? '' })) }));
}

/** Bỏ dấu và hạ chữ thường để so khớp tìm kiếm. */
function fold(text) {
  return String(text).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').toLowerCase();
}

/** Mở máy chủ danh mục giả lập trên cổng cho trước; trả hàm đóng. */
export function startCatalogStub(port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    if (req.method !== 'GET' || !url.pathname.startsWith('/api/catalog/destinations')) { send(404, { error: { code: 'NOT_FOUND' } }); return; }
    const all = loadAll();
    const rest = decodeURIComponent(url.pathname.slice('/api/catalog/destinations'.length).replace(/^\//, ''));
    const [id = '', sub] = rest.split('/');
    if (sub === 'templates') { send(200, { templates: templatesOf(id) }); return; }
    if (id === '') {
      const q = fold(url.searchParams.get('q') ?? '');
      send(200, { destinations: all.filter((d) => fold(`${d.name} ${d.region}`).includes(q)).map(summaryView) });
      return;
    }
    const dest = all.find((d) => d.id === id);
    if (dest) send(200, { destination: detailView(dest) });
    else send(404, { error: { code: 'NOT_FOUND' } });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(() => new Promise((done) => server.close(() => done())))));
}
