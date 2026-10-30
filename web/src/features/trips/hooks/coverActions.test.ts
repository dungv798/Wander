import test from 'node:test';
import assert from 'node:assert/strict';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { TripPatch, TripsGateway } from '../api/TripsGateway.ts';
import { createTrip, S0 } from '../model/tripFixtures.ts';
import { revertPlan } from '../model/revertPlan.ts';
import type { Trip, TripCover, TripsState } from '../model/trip.types.ts';
import { createTripsActions } from './tripsActions.ts';

const before = createTrip(S0, { name: 'Chuyến', destinationId: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-02' }, [], () => 't').trip;
const cover: TripCover = { kind: 'gradient', ref: 'cover-1' };

function harness(update: (id: string, patch: TripPatch) => Promise<void>, initial = before) {
  const store = new PersistentStore<TripsState>('test', { trips: [initial] }, () => null, null);
  let server = initial;
  const gateway = {
    update: async (id: string, patch: TripPatch) => { await update(id, patch); server = { ...server, ...patch }; }, load: async () => server,
    loadAll: async () => [server], create: async () => 't', addItem: async () => 'i', editItem: async () => undefined,
    trash: async () => undefined, restore: async () => undefined, purge: async () => undefined,
    setDone: async () => undefined, reorderDay: async () => undefined, schedule: async () => undefined,
    deleteTrip: async () => undefined, restoreTrip: async () => undefined, loadDeleted: async () => [],
  } satisfies TripsGateway;
  return { store, actions: createTripsActions({ gateway, store }) };
}

test('bìa thay trước phản hồi PATCH; giữ sau thành công, Hoàn tác gửi null về máy chủ', async () => {
  let finish!: () => void;
  const wait = new Promise<void>(resolve => { finish = resolve; });
  const patches: TripPatch[] = [];
  const h = harness(async (_id, patch) => { patches.push(patch); await wait; });
  const pending = h.actions.updateCover('t', cover);
  await Promise.resolve();
  assert.deepEqual(h.actions.current('t')?.cover, cover);
  finish();
  await pending;
  assert.deepEqual(h.actions.current('t')?.cover, cover);
  await h.actions.revert(before);
  assert.deepEqual(patches, [{ cover }, { cover: null }]);
  assert.equal(h.actions.current('t')?.cover, null);
});

test('mạng lỗi hoàn lại bìa cũ và giữ các trường khác của chuyến', async () => {
  const old: TripCover = { kind: 'photo', ref: 'ho-1' };
  const initial: Trip = { ...before, cover: old };
  const h = harness(async () => { throw new Error('mạng lỗi'); }, initial);
  await assert.rejects(h.actions.updateCover('t', cover), /mạng lỗi/);
  assert.deepEqual(h.actions.current('t'), initial);
});

test('thành viên bị chặn ở FE, không gửi PATCH', async () => {
  let calls = 0;
  const h = harness(async () => { calls++; }, { ...before, role: 'member' });
  await assert.rejects(h.actions.updateCover('t', cover));
  assert.equal(calls, 0);
});

test('hai lần đổi đang chờ chạy nối tiếp; lần sau lỗi khôi phục bìa đã lưu của lần trước', async () => {
  let calls = 0;
  const h = harness(async () => { if (++calls === 2) throw new Error('mất mạng'); });
  const first = h.actions.updateCover('t', cover);
  const second = h.actions.updateCover('t', null);
  await first;
  await assert.rejects(second, /mất mạng/);
  assert.deepEqual(h.actions.current('t')?.cover, cover);
});

test('Hoàn tác bìa ảnh/gradient chỉ đổi bìa, dữ liệu cũ không có trường bìa tương đương null', () => {
  assert.deepEqual(revertPlan(before, { ...before, cover }), [{ kind: 'patch', patch: { cover: null } }]);
  assert.deepEqual(revertPlan({ ...before, cover }, { ...before, cover: { kind: 'photo', ref: 'ho-1' } }), [{ kind: 'patch', patch: { cover } }]);
  assert.deepEqual(revertPlan(before, { ...before, cover: null }), []);
});
