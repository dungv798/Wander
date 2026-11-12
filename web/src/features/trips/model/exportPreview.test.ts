import test from 'node:test';
import assert from 'node:assert/strict';
import { S0, assignDay, createTrip, freeItem, addItem, updateItem } from './tripFixtures.ts';
import { calendarEvents, costCell, imageCards, pdfTable, undatedCount } from './exportPreview.ts';
import type { Trip } from './trip.types.ts';

let n = 0;
/** An increasing id so the test is deterministic. */
const ids = (): string => `id${(n += 1)}`;
const nameOf = (i: { placeId: string | null; title: string }): string => i.title || i.placeId || '?';

/** A 2-day trip with: place a (100k), lunch (included, ref), rest, a to-do, place b with no date. */
function trip(): Trip {
  let t = createTrip(S0, { name: 'T', destinationId: 'd', startDate: '2026-11-10', endDate: '2026-11-11' }, [{ id: 'a', category: 'van' }, { id: 'b', category: 'canh' }], ids, 1).trip;
  const [a] = t.items;
  t = assignDay(t, a!.id, '2026-11-10');
  t = updateItem(t, a!.id, { costK: 100, timeOfDay: '09:00' });
  t = addItem(t, { ...freeItem('food', 'Ăn trưa', ids), day: '2026-11-10', included: true, referenceK: 50 });
  t = addItem(t, { ...freeItem('rest', 'Nghỉ', ids), day: '2026-11-11' });
  t = addItem(t, { ...freeItem('lodging', 'Khách sạn', ids), day: '2026-11-11' });
  return t;
}

test('thẻ Ảnh: một thẻ mỗi ngày, mục xếp theo giờ, ngày trống vẫn có thẻ', () => {
  const cards = imageCards(trip(), nameOf);
  assert.equal(cards.length, 2);
  assert.deepEqual(cards[0]?.names, ['a', 'Ăn trưa']);
  assert.match(cards[0]?.label ?? '', /10\/11/);
});

test('bảng PDF theo D17/D18: tổng chỉ cộng mục biết giá, "đã bao gồm" không cộng, chưa biết giá được đếm, Nghỉ không có giá', () => {
  const t = pdfTable(trip(), nameOf);
  assert.equal(t.rows.length, 4);
  assert.equal(t.totalK, 100);
  assert.equal(t.unknownCount, 1, 'khách sạn chưa biết giá');
  assert.deepEqual(t.rows.map((r) => r.cost.kind), ['known', 'included', 'none', 'unknown']);
});

test('mục "Chưa có ngày" không nằm trong bản xuất nhưng được đếm để xem trước nói rõ', () => {
  const x = trip();
  assert.equal(undatedCount(x), 1);
  assert.ok(!pdfTable(x, nameOf).rows.some((r) => r.name === 'b'));
  assert.ok(!calendarEvents(x, nameOf).some((e) => e.title === 'b'));
});

test('lịch: mục không có giờ là sự kiện cả ngày (time = null); có giờ giữ giờ và thời lượng', () => {
  const ev = calendarEvents(trip(), nameOf);
  assert.deepEqual(ev[0], { date: '2026-11-10', time: '09:00', durationMin: null, title: 'a' });
  assert.equal(ev[1]?.time, null);
});

test('ô chi phí: 0 là biết bằng không, không phải chưa biết', () => {
  const zero = { ...freeItem('food', 'x', ids), costK: 0 };
  assert.deepEqual(costCell(zero), { kind: 'known', k: 0 });
});

test('chuyến chưa chắc ngày không xuất ngày giả: nhãn ngày rỗng, không có sự kiện lịch', () => {
  const t = { ...trip(), datesTentative: true };
  assert.deepEqual(imageCards(t, nameOf).map((c) => c.label), ['', '']);
  assert.deepEqual(pdfTable(t, nameOf).rows.map((r) => r.dayLabel), ['', '', '', '']);
  assert.deepEqual(calendarEvents(t, nameOf), []);
});
