import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { agoText, isDuplicateRestore, trashFull } from './tripTrash.ts';
import type { TrashEntry, Trip, TripItem } from './trip.types.ts';

const item = (id: string, placeId: string | null): TripItem => ({ id, placeId, type: 'sightseeing', title: '', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false });
const entry = (id: string, placeId: string | null): TrashEntry => ({ id, item: item(id, placeId), deletedAt: 1, day: null, position: null });

test('thùng rác đầy thì báo đầy (không tự xóa vĩnh viễn mục cũ, D19)', () => {
  const full = { trash: Array.from({ length: LIMITS.MAX_TRASH }, (_, i) => entry(`e${i}`, null)) } as Pick<Trip, 'trash'>;
  assert.equal(trashFull(full), true);
  assert.equal(trashFull({ trash: [] }), false);
});

test('khôi phục sẽ tạo bản thứ hai của một địa điểm đang có trong chuyến thì bị từ chối; mục tự do không bao giờ trùng', () => {
  const live = { items: [item('x', 'dinh-vuong')] } as Pick<Trip, 'items'>;
  assert.equal(isDuplicateRestore(live, entry('y', 'dinh-vuong')), true);
  assert.equal(isDuplicateRestore(live, entry('z', 'cot-co')), false);
  assert.equal(isDuplicateRestore(live, entry('w', null)), false);
});

test('agoText: vừa xong, phút, giờ, ngày', () => {
  const now = 10 * 86_400_000;
  assert.match(agoText(now - 5_000, now), /vừa xong/i);
  assert.match(agoText(now - 5 * 60_000, now), /5 phút/);
  assert.match(agoText(now - 3 * 3_600_000, now), /3 giờ/);
  assert.match(agoText(now - 2 * 86_400_000, now), /2 ngày/);
});
