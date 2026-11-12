// Load script for the Wander API (k6). One virtual user repeats what a person does in the app: open it (anonymous identity), create a trip,
// add a few items, then read the trip and the trip list several times. Run it with `make perf` (see docs/performance.md); the backend needs
// the rate limits raised, otherwise the limiter (correctly) answers 429 to a single machine creating hundreds of identities.
//
//   k6 run -e BASE_URL=http://localhost:8787 tools/perf/k6-trip-flow.js
//
// The thresholds are a regression guard for a developer machine, not a promise about any deployment.
import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';
const VUS = Number(__ENV.VUS || 20);
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const options = {
  scenarios: {
    trip_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: VUS },
        { duration: '60s', target: VUS },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    'http_req_duration{name:GET /api/trips/{id}}': ['p(95)<1000'],
  },
};

/** Authorization header of an identity created by this iteration. */
function bearer(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/** One person's visit: identity, trip, items, then repeated reads. */
export default function () {
  let token;
  group('open the app (anonymous identity)', () => {
    const res = http.post(`${BASE_URL}/api/identity`, JSON.stringify({ skipRecoveryCode: true }), { headers: JSON_HEADERS, tags: { name: 'POST /api/identity' } });
    check(res, { 'identity created': (r) => r.status === 201 });
    token = res.json('token');
  });
  if (!token) return;

  let tripId;
  group('plan a trip', () => {
    const trip = http.post(
      `${BASE_URL}/api/trips`,
      JSON.stringify({ name: 'Hà Giang – Tà Xùa', destination: 'Hà Giang', startDate: '2026-08-29', endDate: '2026-09-06' }),
      { headers: bearer(token), tags: { name: 'POST /api/trips' } },
    );
    check(trip, { 'trip created': (r) => r.status === 201 });
    tripId = trip.json('trip.id');
    for (let i = 0; i < 3; i++) {
      const item = http.post(
        `${BASE_URL}/api/trips/${tripId}/items`,
        JSON.stringify({ day: '2026-08-31', type: 'food', title: `Mục ${i}` }),
        { headers: bearer(token), tags: { name: 'POST /api/trips/{id}/items' } },
      );
      check(item, { 'item added': (r) => r.status === 201 });
    }
  });

  group('look at it again and again', () => {
    for (let i = 0; i < 5; i++) {
      const trips = http.get(`${BASE_URL}/api/trips`, { headers: bearer(token), tags: { name: 'GET /api/trips' } });
      check(trips, { 'list ok': (r) => r.status === 200 });
      const trip = http.get(`${BASE_URL}/api/trips/${tripId}`, { headers: bearer(token), tags: { name: 'GET /api/trips/{id}' } });
      check(trip, { 'trip ok': (r) => r.status === 200 });
    }
  });
}
