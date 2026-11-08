import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PlaceView } from './Catalog.types.ts';
import { placeFacts } from './placeFacts.ts';
import { isTrek } from './trekking.ts';

const place = (category: string, away: PlaceView['away'] = [{ refId: 'tp', refName: 'TP Hà Giang', km: 104, minutes: 240, approximate: true }]): PlaceView => ({ id: 'p', name: 'Nơi', category, duration: '4–6 giờ', difficulty: 'Khó', away, photos: [] }) as unknown as PlaceView;

test('quán và khách sạn hiện loại hình, không gán giờ hay giá chưa có nguồn', () => {
  const facts = placeFacts({ ...place('luu'), venue: { kind: 'lodging', kindName: 'Chỗ ở', address: 'Địa chỉ', website: '', sourceUrl: 'https://example.org', checkedAt: '2026-11-07' } });
  assert.equal(facts[0]?.value, 'Chỗ ở');
  assert.ok(facts.some(f => f.label === 'Nhận phòng'));
  assert.ok(!facts.some(f => f.icon === 'gauge'));
  assert.match(facts[1]?.value ?? '', /Xác nhận/);
});

test('giờ phục vụ và phân khúc đã có nguồn hiển thị nguyên văn thay cho lời nhắc chưa có dữ liệu', () => {
  const published = { kind: 'restaurant' as const, kindName: 'Quán ăn', address: 'Địa chỉ', website: '', sourceUrl: 'https://example.org', checkedAt: '2026-11-07', serviceHours: 'T3–CN 18:00–23:00', priceNote: 'Phân khúc Michelin: chi tiêu vừa phải; xem giá trên thực đơn.' };
  const facts = placeFacts({ ...place('am'), venue: published });
  assert.equal(facts[1]?.value, published.priceNote);
  assert.equal(facts[2]?.value, published.serviceHours);
});

test('nơi thường: có thời gian xe máy ước tính từ mốc', () => {
  const facts = placeFacts(place('canh'));
  assert.deepEqual(facts.map((f) => f.icon), ['clock', 'gauge', 'route', 'motorbike']);
  assert.match(facts[3]?.value ?? '', /4/);
});

test('leo núi/trekking: KHÔNG suy ra giờ xe máy lên đỉnh; khoảng cách chỉ là điểm tham chiếu; nói thẳng chưa có dữ liệu tuyến', () => {
  const facts = placeFacts(place('leo'));
  assert.ok(isTrek(place('leo')));
  assert.ok(!facts.some((f) => f.icon === 'motorbike'), 'không có ô xe máy');
  assert.equal(facts[0]?.value, '4–6 giờ', 'giữ thời gian thực tế của nơi');
  assert.equal(facts[1]?.value, 'Khó', 'giữ độ khó');
  assert.match(facts[2]?.label ?? '', /tham chiếu/i);
  assert.match(facts[3]?.value ?? '', /Chưa có dữ liệu tuyến/);
});

test('leo núi không có mốc cách xa: không bịa số, hiện dấu trống', () => {
  const facts = placeFacts(place('leo', []));
  assert.equal(facts[2]?.value, '—');
  assert.equal(facts.length, 4);
});
