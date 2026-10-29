import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CATALOG = path.join(ROOT, 'backend/src/main/resources/catalog');
const CATEGORY = { canh: 'Cảnh quan', van: 'Văn hóa', am: 'Ẩm thực', leo: 'Leo núi', luu: 'Lưu trú', cho: 'Chợ' };
const VERDICT = { must: 'Nên ghé', worth: 'Đáng đi', ifconv: 'Chỉ ghé nếu tiện' };

/** Đọc catalog thật và chuyển các trường của kho JSON sang hợp đồng API dùng trong giao diện. */
export function readCatalog() {
  return fs.readdirSync(CATALOG).filter((name) => name.endsWith('.json')).map((name) => {
    const d = JSON.parse(fs.readFileSync(path.join(CATALOG, name), 'utf8'));
    const places = d.places.map((p) => ({ ...p, categoryName: CATEGORY[p.category], verdictLabel: VERDICT[p.verdict], away: [], photos: p.photos.map((photo) => ({ ...photo, url: `/catalog/photos/${photo.file}` })) }));
    return { ...d, places, coverUrl: places.find((p) => p.id === d.coverPlaceId)?.photos[0]?.url, guide: d.guide.map((g) => ({ ...g, layout: g.layout.toLowerCase(), bestMonths: g.bestMonths ?? [], rainyMonths: g.rainyMonths ?? [], notes: g.notes ?? [], items: (g.items ?? []).map((i) => ({ text: '', placeId: null, ...i })) })) };
  });
}

/** Tóm tắt tọa độ từ các điểm có thật; không cần backend hoặc tile mạng. */
function summarize(d) {
  const points = d.places.filter((p) => p.lat != null && p.lon != null);
  return { ...d, lat: points.reduce((s, p) => s + p.lat, 0) / points.length, lon: points.reduce((s, p) => s + p.lon, 0) / points.length, placeCount: d.places.length, bestMonths: [], previews: [] };
}

const TRIP = { id: 'look-ha-giang', name: 'Hà Giang — những ngày nắng', destination: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-03', role: 'organizer', memberCount: 1, selfMemberId: 'look', kind: { code: 'friends', label: 'Bạn bè' }, interests: [], styles: [], pace: null, budgetK: 3000, createdAt: '2026-10-28T00:00:00Z' };

/** Chặn toàn bộ API bằng dữ liệu cục bộ; yêu cầu ngoài máy bị chặn để ảnh tái lập khi không có mạng. */
export async function mockApi(page, catalog) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const p = url.pathname;
    let json;
    if (p.endsWith('/templates')) json = { templates: [] };
    else if (p === '/api/catalog/destinations') json = { destinations: catalog.map(summarize) };
    else if (p.startsWith('/api/catalog/destinations/')) json = { destination: catalog.find((d) => d.id === p.split('/').at(-1)) };
    else if (p === '/api/sessions') json = { sessions: [{ id: 'look', deviceName: 'Máy thử giao diện', current: true, lastSeenAt: '2026-10-28T00:00:00Z' }] };
    else if (p === '/api/events') json = { events: [], unseen: false };
    else if (p === '/api/recovery-code') json = { hasCode: true };
    else if (p === '/api/trips') json = { trips: [TRIP] };
    else if (p.endsWith('/checklist')) json = { items: [] };
    else if (p.endsWith('/deletion-requests')) json = { requests: [] };
    else if (p.endsWith('/trash')) json = { items: [] };
    else if (p === '/api/trips/look-ha-giang') json = { trip: TRIP, days: [{date: TRIP.startDate, items: catalog.find(d => d.id === TRIP.destination).places.slice(0, 3).map((place, i) => ({id: `look-item-${i}`, placeId: place.id, type: 'sightseeing', title: place.name, day: TRIP.startDate, position: i, costK: 100, durationMin: 60, included: false, booking: null}))}], unscheduled: [] };
    else throw new Error(`API chưa giả lập: ${p}`);
    await route.fulfill({ json });
  });
}

