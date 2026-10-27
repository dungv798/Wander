import test from 'node:test';
import assert from 'node:assert/strict';
import { detailItems, toItem, toTrash, toTrip } from './tripMapper.ts';

const ITEM = {
  id: 'i1', tripId: 't1', placeId: 'dinh-vuong', day: '2026-11-01', position: 2, type: 'sightseeing', title: '', timeOfDay: '10:00',
  durationMin: 60, note: 'ghi chú', costK: 30, included: false, referenceK: null, booking: 'booked', done: false, deletedAt: null,
};
const VIEW = {
  id: 't1', name: 'Hà Giang', destination: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-03', budgetK: 3000, datesTentative: true,
  styles: [{ code: 'explore', label: 'Khám phá' }], pace: { code: 'moderate', label: 'Vừa' }, kind: { code: 'friends', label: 'Bạn bè' },
  interests: [{ code: 'canh', label: 'Cảnh' }], createdAt: '2026-10-27T01:00:00Z', updatedAt: '2026-10-27T02:00:00Z',
};

test('mục: giữ đủ trường, thứ hạng là số nguyên, booking null cho Nghỉ/Việc', () => {
  assert.deepEqual(toItem(ITEM), { id: 'i1', placeId: 'dinh-vuong', type: 'sightseeing', title: '', day: '2026-11-01', position: 2, timeOfDay: '10:00', durationMin: 60, note: 'ghi chú', costK: 30, included: false, referenceK: null, booking: 'booked', done: false });
  assert.equal(toItem({ ...ITEM, type: 'rest', booking: null })?.booking, null);
});

test('mục chưa có ngày: day null và position null (giao diện chưa xếp)', () => {
  const item = toItem({ ...ITEM, day: null, position: 0 });
  assert.equal(item?.day, null);
  assert.equal(item?.position, null);
});

test('mục hỏng hoặc loại lạ bị bỏ (null), không làm sập màn', () => {
  for (const bad of [null, 'x', {}, { ...ITEM, id: 5 }, { ...ITEM, type: 'ufo' }, { ...ITEM, costK: -1 }]) assert.equal(toItem(bad), null);
});

test('thùng rác: dựng TrashEntry từ deletedAt, giữ ngày và vị trí cũ; mục không có deletedAt bị bỏ', () => {
  const entry = toTrash({ ...ITEM, deletedAt: '2026-10-27T03:00:00Z' });
  assert.equal(entry?.id, 'i1');
  assert.equal(entry?.deletedAt, Date.parse('2026-10-27T03:00:00Z'));
  assert.equal(entry?.day, '2026-11-01');
  assert.equal(entry?.position, 2);
  assert.equal(entry?.item.id, 'i1');
  assert.equal(toTrash(ITEM), null);
});

test('chi tiết chuyến: gộp các ngày và mục chưa có ngày thành danh sách phẳng', () => {
  const detail = { trip: VIEW, days: [{ date: '2026-11-01', items: [ITEM] }, { date: '2026-11-02', items: [{ ...ITEM, id: 'i2', day: '2026-11-02', position: 0 }] }], unscheduled: [{ ...ITEM, id: 'i3', day: null, position: 0 }] };
  assert.deepEqual(detailItems(detail).map((i) => i.id), ['i1', 'i2', 'i3']);
  assert.deepEqual(detailItems({ days: 'x' }), []);
});

test('chuyến: kind là MÃ, kiểu/nhịp/sở thích là mã, ngày tạo là mili giây, mục và thùng rác gắn vào', () => {
  const trip = toTrip(VIEW, [toItem(ITEM)!], []);
  assert.ok(trip);
  assert.equal(trip.kind, 'friends');
  assert.deepEqual(trip.styles, ['explore']);
  assert.equal(trip.pace, 'moderate');
  assert.deepEqual(trip.interests, ['canh']);
  assert.equal(trip.destinationId, 'ha-giang');
  assert.equal(trip.budgetK, 3000);
  assert.equal(trip.datesTentative, true);
  assert.equal(trip.createdAt, Date.parse('2026-10-27T01:00:00Z'));
  assert.equal(trip.items.length, 1);
});

test('chuyến thiếu trường bắt buộc thì null; trường tùy chọn thiếu thì mặc định an toàn', () => {
  assert.equal(toTrip({ ...VIEW, id: undefined }, [], []), null);
  assert.equal(toTrip(null, [], []), null);
  const bare = toTrip({ id: 't', name: 'A', destination: 'd', startDate: '2026-11-01', endDate: '2026-11-01', createdAt: '2026-10-27T01:00:00Z' }, [], []);
  assert.equal(bare?.kind, null);
  assert.equal(bare?.pace, null);
  assert.equal(bare?.budgetK, null);
  assert.deepEqual(bare?.interests, []);
});
