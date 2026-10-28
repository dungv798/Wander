import test from 'node:test';
import assert from 'node:assert/strict';
import { permissionsOf } from './tripPermissions.ts';
import type { Trip, TripItem } from './trip.types.ts';

const item = (id: string, addedBy: string | null): TripItem => ({ id, placeId: null, type: 'food', title: id, day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false, addedBy, doneBy: [] });
const trip = (role: 'organizer' | 'member', selfMemberId: string | null): Trip => ({ id: 't', role, memberCount: 2, selfMemberId, name: 'A', destinationId: 'd', startDate: '2026-11-01', endDate: '2026-11-02', datesTentative: false, kind: null, interests: [], styles: [], pace: null, budgetK: null, items: [], trash: [], createdAt: 1 });

test('Organizer làm được mọi việc và sửa/xóa/khôi phục mọi mục', () => {
  const p = permissionsOf(trip('organizer', 'o'));
  assert.equal(p.organizer, true);
  assert.equal(p.manageTrip, true);
  assert.equal(p.schedule, true);
  assert.equal(p.purge, true);
  assert.equal(p.canChange(item('x', 'm1')), true);
  assert.equal(p.canChange(item('y', null)), true);
});

test('thành viên: không quản lý chuyến/xếp lịch/xóa vĩnh viễn; chỉ sửa mục do mình thêm; mục Organizer hoặc người khác thì phải đề nghị', () => {
  const p = permissionsOf(trip('member', 'm1'));
  assert.equal(p.organizer, false);
  assert.equal(p.manageTrip, false);
  assert.equal(p.schedule, false);
  assert.equal(p.purge, false);
  assert.equal(p.canChange(item('mine', 'm1')), true);
  assert.equal(p.canChange(item('theirs', 'm2')), false);
  assert.equal(p.canChange(item('organizers', null)), false);
});

test('thiếu mã thành viên của mình thì không có quyền sửa mục nào (an toàn theo mặc định)', () => {
  const p = permissionsOf(trip('member', null));
  assert.equal(p.canChange(item('x', null)), false);
  assert.equal(p.canChange(item('x', 'm1')), false);
});
