import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVisitMinutes } from './visitMinutes.ts';

test('đọc thời lượng tham quan từ nhãn catalog; không hiểu thì null, không tự gán', () => {
  assert.equal(parseVisitMinutes('1–2 giờ'), 90);
  assert.equal(parseVisitMinutes('30–45 phút'), 38);
  assert.equal(parseVisitMinutes('1 giờ'), 60);
  assert.equal(parseVisitMinutes('1,5–2 giờ'), 105);
  assert.equal(parseVisitMinutes('45 phút'), 45);
  assert.equal(parseVisitMinutes('Nửa ngày'), 240);
  assert.equal(parseVisitMinutes('Cả ngày'), 480);
  assert.equal(parseVisitMinutes('1 ngày'), 480);
  assert.equal(parseVisitMinutes('1–2 ngày'), 720);
  assert.equal(parseVisitMinutes('tùy hứng'), null);
  assert.equal(parseVisitMinutes(''), null);
  assert.equal(parseVisitMinutes(undefined), null);
  assert.equal(parseVisitMinutes('2–3 giờ (tham khảo)'), 150);
  assert.equal(parseVisitMinutes('Theo tuyến và lịch đoàn'), null);
  assert.equal(parseVisitMinutes('Theo tuyến của Vườn'), null);
});
