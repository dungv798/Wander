import { readCatalog } from '../look/capture-fixtures.mjs';

export const catalog = readCatalog();
export const destination = catalog.find(d => d.id === 'da-lat');
export const trip = { id: 'journey', name: 'Một ngày ở Đà Lạt', destination: 'da-lat', startDate: '2026-11-01', endDate: '2026-11-01', role: 'organizer', memberCount: 1, selfMemberId: 'demo', kind: null, interests: [], styles: [], pace: null, budgetK: null, createdAt: '2026-10-30T00:00:00Z' };
export const places = destination.places.filter(p => p.lat != null && p.photos.length).slice(0, 5);
export const items = places.map((p, i) => ({ id: `journey-${i}`, placeId: p.id, type: 'sightseeing', title: p.name, day: trip.startDate, position: i, costK: null, durationMin: null, included: false, booking: null }));

/** Seed dữ liệu biên tập thật; thông tin giá, thời lượng và ngân sách để trống. */
export async function seed(context) {
  await context.addInitScript(() => {
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
    localStorage.setItem('wander.web.token.v1', JSON.stringify({ token: 'journey_local_fixture_aaaaaaaaaaaaaaaaaaaaaaaa' }));
  });
}

/** Giả API trong bộ nhớ; offline mặc định, --live chỉ mở mạng cho nền bản đồ. */
export async function mockJourney(page, live = false) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      if (url.href === 'https://tiles.openfreemap.org/styles/liberty' && !live) return route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'offline', type: 'background', paint: { 'background-color': 'rgb(226,237,229)' } }] } });
      return live ? route.continue() : route.abort();
    }
    const p = url.pathname;
    if (!p.startsWith('/api/')) return route.continue();
    let json;
    if (p.endsWith('/templates')) json = { templates: [] };
    else if (p === '/api/catalog/destinations') json = { destinations: catalog.map(d => ({ ...d, lat: d.places[0].lat, lon: d.places[0].lon, placeCount: d.places.length, bestMonths: [], previews: [] })) };
    else if (p.startsWith('/api/catalog/destinations/')) json = { destination: catalog.find(d => d.id === p.split('/').at(-1)) };
    else if (p === '/api/sessions') json = { sessions: [{ id: 'demo', deviceName: 'Bản quay minh họa', current: true, lastSeenAt: '2026-10-30T00:00:00Z' }] };
    else if (p === '/api/events') json = { events: [], unseen: false };
    else if (p === '/api/recovery-code') json = { hasCode: true };
    else if (p === '/api/trips') json = { trips: [trip] };
    else if (p === '/api/trips/journey') json = { trip, days: [{ date: trip.startDate, items }], unscheduled: [] };
    else if (p.endsWith('/trash') || p.endsWith('/checklist')) json = { items: [] };
    else if (p.endsWith('/deletion-requests')) json = { requests: [] };
    else return route.fulfill({ status: 501, json: { message: `API chưa giả lập: ${p}` } });
    return route.fulfill({ json });
  });
}
