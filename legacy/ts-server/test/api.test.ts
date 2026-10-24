import test from 'node:test';
import assert from 'node:assert/strict';
import type { DatabaseSync } from 'node:sqlite';
import { revokeSession } from '../src/api/auth.ts';
import { withApp } from './helpers.ts';

// ---- Danh tính và phiên (D15; INV-1, INV-2, INV-6) ----

test('yêu cầu không có phiên hợp lệ bị từ chối', async () => {
  await withApp(async ({ call }) => {
    assert.equal((await call('GET', '/api/trips')).status, 401);
    assert.equal((await call('GET', '/api/trips', 'khong-phai-token-hop-le-nao-ca-1234')).status, 401);
    assert.equal((await call('GET', '/api/trips', 'ngan')).status, 401);
  });
});

test('token không được lưu nguyên văn trong cơ sở dữ liệu', async () => {
  await withApp(async ({ db, newUser }) => {
    const { token } = await newUser();
    const row = (db as DatabaseSync).prepare('SELECT token_hash FROM sessions').get() as { token_hash: string };
    assert.notEqual(row.token_hash, token);
    assert.match(row.token_hash, /^[0-9a-f]{64}$/);
  });
});

test('INV-2: phiên đã thu hồi mất quyền ngay ở yêu cầu kế tiếp', async () => {
  await withApp(async ({ db, call, newUser, newTrip }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    assert.equal((await call('GET', `/api/trips/${tripId}`, token)).status, 200);
    const sid = (db.prepare('SELECT id FROM sessions').get() as { id: string }).id;
    revokeSession(db, sid);
    assert.equal((await call('GET', `/api/trips/${tripId}`, token)).status, 401);
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { day: '2026-08-30', type: 'food', title: 'x' })).status, 401);
  });
});

test('INV-6: chuyến của người khác trả về không tìm thấy, giống chuyến không tồn tại', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const a = await newUser();
    const b = await newUser();
    const tripId = await newTrip(a.token);
    const item = await newItem(a.token, tripId, {});

    const missing = await call('GET', '/api/trips/00000000-0000-0000-0000-000000000000', b.token);
    const foreign = await call('GET', `/api/trips/${tripId}`, b.token);
    assert.equal(foreign.status, 404);
    assert.deepEqual(foreign.body, missing.body);

    assert.equal((await call('PATCH', `/api/trips/${tripId}`, b.token, { name: 'bị chiếm' })).status, 404);
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, b.token, { day: '2026-08-30', type: 'food', title: 'x' })).status, 404);
    assert.equal((await call('DELETE', `/api/trips/${tripId}/items/${item.id}`, b.token)).status, 404);
    assert.equal((await call('GET', `/api/trips/${tripId}/trash`, b.token)).status, 404);
    assert.deepEqual((await call('GET', '/api/trips', b.token)).body.trips, []);
    // chủ thật không bị ảnh hưởng
    assert.equal((await call('GET', `/api/trips/${tripId}`, a.token)).body.trip.name, 'Hà Giang – Tà Xùa');
  });
});

test('chống lạm dụng: giới hạn số danh tính tạo từ một địa chỉ', async () => {
  await withApp(
    async ({ call }) => {
      assert.equal((await call('POST', '/api/identity')).status, 201);
      assert.equal((await call('POST', '/api/identity')).status, 201);
      const third = await call('POST', '/api/identity');
      assert.equal(third.status, 429);
      assert.equal(third.body.error.code, 'RATE_LIMITED');
    },
    { identityLimitPerHour: 2 },
  );
});

test('nội dung gửi lên: JSON hỏng bị chặn, nội dung quá lớn bị chặn', async () => {
  await withApp(async ({ call, newUser }) => {
    const { token } = await newUser();
    const bad = await call('POST', '/api/trips', token, undefined, '{khong phai json');
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'INVALID_JSON');
    const big = await call('POST', '/api/trips', token, undefined, JSON.stringify({ name: 'x'.repeat(70_000) }));
    assert.equal(big.status, 413);
  });
});

// ---- Chuyến: A-1, A-2 ----

test('A-1: tạo chuyến cần tên, điểm đến, ngày đi, ngày về hợp lệ', async () => {
  await withApp(async ({ call, newUser }) => {
    const { token } = await newUser();
    const ok = { name: 'Chuyến', destination: 'Hà Giang', startDate: '2026-08-29', endDate: '2026-09-06' };
    assert.equal((await call('POST', '/api/trips', token, { ...ok, startDate: undefined })).body.error.code, 'START_REQUIRED');
    assert.equal((await call('POST', '/api/trips', token, { ...ok, endDate: '' })).body.error.code, 'END_REQUIRED');
    assert.equal((await call('POST', '/api/trips', token, { ...ok, endDate: '2026-08-01' })).body.error.code, 'END_BEFORE_START');
    assert.equal((await call('POST', '/api/trips', token, { ...ok, name: '  ' })).body.error.code, 'REQUIRED');
    assert.equal((await call('POST', '/api/trips', token, { ...ok, destination: undefined })).status, 400);
    assert.equal((await call('POST', '/api/trips', token, ok)).status, 201);
  });
});

test('A-2: chuyến 29/08–06/09/2026 có 9 ngày kèm thứ trong tuần', async () => {
  await withApp(async ({ call, newUser, newTrip }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const detail = (await call('GET', `/api/trips/${tripId}`, token)).body;
    assert.equal(detail.dayCount, 9);
    assert.equal(detail.days.length, 9);
    assert.equal(detail.days[0].date, '2026-08-29');
    assert.equal(detail.days[0].weekdayLabel, 'T7');
    assert.equal(detail.days[8].date, '2026-09-06');
    assert.equal(detail.totals.extraK, 0);
    assert.equal(detail.totals.extraFormatted, '0 ₫');
  });
});

// ---- Mục: A-3…A-7, A-9…A-11 ----

test('A-3/A-4/A-9/A-10: thêm mục vào ngày đã chọn; đủ 9 loại; Nghỉ và Việc cần làm', async () => {
  await withApp(async ({ call, newUser, newTrip }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const types = ['sightseeing', 'food', 'transport', 'lodging', 'car_rental', 'shopping', 'tour', 'rest', 'task'];
    for (const type of types) {
      const r = await call('POST', `/api/trips/${tripId}/items`, token, { day: '2026-08-31', type, title: `Mục ${type}` });
      assert.equal(r.status, 201, type);
      assert.equal(r.body.item.day, '2026-08-31');
    }
    const detail = (await call('GET', `/api/trips/${tripId}`, token)).body;
    const day = detail.days.find((d: { date: string }) => d.date === '2026-08-31');
    assert.equal(day.items.length, 9);
    assert.equal(day.items.find((i: { type: string }) => i.type === 'rest').typeLabel, 'Nghỉ');
    assert.equal(day.items.find((i: { type: string }) => i.type === 'task').typeLabel, 'Việc cần làm');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { day: '2026-08-31', type: 'khong-co', title: 'x' })).body.error.code, 'INVALID_TYPE');
  });
});

test('A-3: tiêu đề và ngày bắt buộc; ngày phải nằm trong chuyến', async () => {
  await withApp(async ({ call, newUser, newTrip }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const base = { day: '2026-08-30', type: 'food', title: 'Phở' };
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, title: ' ' })).body.error.code, 'REQUIRED');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, day: undefined })).body.error.code, 'INVALID_DATE');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, day: '2026-09-07' })).body.error.code, 'DAY_OUT_OF_RANGE');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, timeOfDay: '25:00' })).status, 400);
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, durationMin: -5 })).status, 400);
  });
});

test('D16/A-5: giờ và thời lượng để trống được; thứ tự thủ công không bị đổi giờ làm xáo trộn', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const a = await newItem(token, tripId, { title: 'A', timeOfDay: '09:00' });
    const b = await newItem(token, tripId, { title: 'B' }); // không giờ
    const c = await newItem(token, tripId, { title: 'C', timeOfDay: '08:00' });
    const order = async () =>
      ((await call('GET', `/api/trips/${tripId}`, token)).body.days[1].items as { title: string }[]).map((i) => i.title);
    assert.deepEqual(await order(), ['A', 'B', 'C']); // thứ tự thêm vào, không theo giờ

    const re = await call('POST', `/api/trips/${tripId}/days/2026-08-30/reorder`, token, { orderedIds: [c.id, a.id, b.id] });
    assert.equal(re.status, 200);
    assert.deepEqual(await order(), ['C', 'A', 'B']);

    // đổi giờ không tự sắp xếp lại
    await call('PATCH', `/api/trips/${tripId}/items/${a.id}`, token, { timeOfDay: '05:00' });
    assert.deepEqual(await order(), ['C', 'A', 'B']);
  });
});

test('A-5: sắp xếp phải gồm đúng các mục đang hiện trong ngày', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const a = await newItem(token, tripId, { title: 'A' });
    const b = await newItem(token, tripId, { title: 'B' });
    const path = `/api/trips/${tripId}/days/2026-08-30/reorder`;
    assert.equal((await call('POST', path, token, { orderedIds: [a.id] })).body.error.code, 'INVALID_ORDER');
    assert.equal((await call('POST', path, token, { orderedIds: [a.id, a.id] })).body.error.code, 'INVALID_ORDER');
    assert.equal((await call('POST', path, token, { orderedIds: [a.id, 'khong-co'] })).body.error.code, 'INVALID_ORDER');
    assert.equal((await call('POST', path, token, { orderedIds: 'abc' })).body.error.code, 'MALFORMED');
    assert.equal((await call('POST', path, token, { orderedIds: [b.id, a.id] })).status, 200);
  });
});

test('A-7: sửa mọi trường và chuyển mục sang ngày khác (xuống cuối ngày mới, ngày cũ liền mạch)', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const a = await newItem(token, tripId, { title: 'A' });
    await newItem(token, tripId, { title: 'B' });
    await newItem(token, tripId, { title: 'X', day: '2026-08-31' });

    const r = await call('PATCH', `/api/trips/${tripId}/items/${a.id}`, token, {
      title: 'A đã sửa',
      type: 'food',
      note: 'ghi chú',
      timeOfDay: '12:15',
      durationMin: 60,
      day: '2026-08-31',
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.item.day, '2026-08-31');
    assert.equal(r.body.item.title, 'A đã sửa');
    assert.equal(r.body.item.type, 'food');
    assert.equal(r.body.item.position, 1); // sau X

    const days = (await call('GET', `/api/trips/${tripId}`, token)).body.days;
    assert.deepEqual(days[1].items.map((i: { title: string; position: number }) => [i.title, i.position]), [['B', 0]]);
    assert.deepEqual(days[2].items.map((i: { title: string; position: number }) => [i.title, i.position]), [['X', 0], ['A đã sửa', 1]]);

    assert.equal((await call('PATCH', `/api/trips/${tripId}/items/${a.id}`, token, { day: '2026-12-01' })).body.error.code, 'DAY_OUT_OF_RANGE');
  });
});

// ---- Tiền: A-6, R2–R4 ----

test('A-6/R4: trống = chưa biết, 0 = đã biết bằng 0, đã bao gồm không cộng vào tổng', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    await newItem(token, tripId, { cost: 150 }); // 150.000 ₫
    await newItem(token, tripId, { cost: 0 }); // đã biết bằng 0
    await newItem(token, tripId, {}); // chưa biết
    await newItem(token, tripId, { cost: '', included: true, referenceCost: 500 }); // đã bao gồm, giá tham khảo
    const detail = (await call('GET', `/api/trips/${tripId}`, token)).body;
    assert.equal(detail.totals.extraK, 150);
    assert.equal(detail.totals.extraFormatted, '150.000 ₫');
    const items = detail.days[1].items;
    assert.equal(items[0].costFormatted, '150.000 ₫');
    assert.equal(items[1].costK, 0);
    assert.equal(items[1].costFormatted, '0 ₫');
    assert.equal(items[2].costK, null);
    assert.equal(items[2].costFormatted, null);
    assert.equal(items[3].included, true);
    assert.equal(items[3].referenceFormatted, '500.000 ₫');
  });
});

test('R3: chi phí âm và định dạng sai bị chặn khi tạo và khi sửa', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const base = { day: '2026-08-30', type: 'food', title: 'x' };
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, cost: -1 })).body.error.code, 'NEGATIVE');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, cost: '1.5' })).body.error.code, 'MALFORMED');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, cost: 'abc' })).body.error.field, 'cost');
    assert.equal((await call('POST', `/api/trips/${tripId}/items`, token, { ...base, cost: 100, referenceCost: 5 })).body.error.code, 'REFERENCE_REQUIRES_INCLUDED');
    const it = await newItem(token, tripId, { cost: 10 });
    assert.equal((await call('PATCH', `/api/trips/${tripId}/items/${it.id}`, token, { cost: -3 })).status, 400);
    // dữ liệu không bị đổi sau khi sửa thất bại
    assert.equal((await call('GET', `/api/trips/${tripId}/items/${it.id}`, token)).body.item.costK, 10);
  });
});

test('R4: bỏ tick "đã bao gồm" thì tổng cộng lại chi phí và giá tham khảo bị xóa', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const it = await newItem(token, tripId, { cost: 200, included: true, referenceCost: 200 });
    assert.equal((await call('GET', `/api/trips/${tripId}`, token)).body.totals.extraK, 0);
    const r = await call('PATCH', `/api/trips/${tripId}/items/${it.id}`, token, { included: false });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.item.referenceK, null);
    assert.equal((await call('GET', `/api/trips/${tripId}`, token)).body.totals.extraK, 200);
  });
});

// ---- Xóa mềm, Hoàn tác, Đã xóa gần đây: D19, R7, A-8 ----

test('R7/A-8: xóa mềm bỏ mục khỏi lịch và tổng; khôi phục về đúng ngày và vị trí cũ', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const a = await newItem(token, tripId, { title: 'A', cost: 100 });
    const b = await newItem(token, tripId, { title: 'B', cost: 200 });
    const c = await newItem(token, tripId, { title: 'C', cost: 300 });
    const titles = async () =>
      ((await call('GET', `/api/trips/${tripId}`, token)).body.days[1].items as { title: string }[]).map((i) => i.title);

    const del = await call('DELETE', `/api/trips/${tripId}/items/${b.id}`, token);
    assert.equal(del.status, 200);
    assert.ok(del.body.item.deletedAt);
    assert.deepEqual(await titles(), ['A', 'C']);
    let detail = (await call('GET', `/api/trips/${tripId}`, token)).body;
    assert.equal(detail.totals.extraK, 400);
    assert.equal(detail.trashCount, 1);
    assert.equal((await call('GET', `/api/trips/${tripId}/trash`, token)).body.items[0].title, 'B');

    // Hoàn tác = khôi phục về chỗ cũ
    const restored = await call('POST', `/api/trips/${tripId}/items/${b.id}/restore`, token);
    assert.equal(restored.status, 200);
    assert.equal(restored.body.item.deletedAt, null);
    assert.deepEqual(await titles(), ['A', 'B', 'C']);
    detail = (await call('GET', `/api/trips/${tripId}`, token)).body;
    assert.equal(detail.totals.extraK, 600);
    assert.equal(detail.trashCount, 0);
    void a;
    void c;
  });
});

test('D19: mục đã xóa giữ đến khi xóa vĩnh viễn, không tự hết hạn', async () => {
  await withApp(async ({ db, call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const it = await newItem(token, tripId, { title: 'A' });
    await call('DELETE', `/api/trips/${tripId}/items/${it.id}`, token);
    // giả lập đã xóa từ rất lâu
    db.prepare("UPDATE items SET deleted_at = '2020-01-01T00:00:00.000Z' WHERE id = ?").run(it.id);
    assert.equal((await call('GET', `/api/trips/${tripId}/trash`, token)).body.items.length, 1);
    assert.equal((await call('POST', `/api/trips/${tripId}/items/${it.id}/restore`, token)).status, 200);
  });
});

test('A-8: xóa vĩnh viễn chỉ áp dụng cho mục trong "Đã xóa gần đây" và không khôi phục được', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const it = await newItem(token, tripId, { title: 'A' });
    assert.equal((await call('DELETE', `/api/trips/${tripId}/items/${it.id}/permanent`, token)).body.error.code, 'NOT_IN_TRASH');
    await call('DELETE', `/api/trips/${tripId}/items/${it.id}`, token);
    assert.equal((await call('DELETE', `/api/trips/${tripId}/items/${it.id}`, token)).body.error.code, 'ALREADY_DELETED');
    assert.equal((await call('DELETE', `/api/trips/${tripId}/items/${it.id}/permanent`, token)).status, 204);
    assert.equal((await call('POST', `/api/trips/${tripId}/items/${it.id}/restore`, token)).status, 404);
    assert.deepEqual((await call('GET', `/api/trips/${tripId}/trash`, token)).body.items, []);
  });
});

test('A-8: không khôi phục mục chưa xóa; không sửa mục đã xóa', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const it = await newItem(token, tripId, { title: 'A' });
    assert.equal((await call('POST', `/api/trips/${tripId}/items/${it.id}/restore`, token)).body.error.code, 'NOT_DELETED');
    await call('DELETE', `/api/trips/${tripId}/items/${it.id}`, token);
    assert.equal((await call('PATCH', `/api/trips/${tripId}/items/${it.id}`, token, { title: 'B' })).body.error.code, 'ITEM_DELETED');
  });
});

// ---- R12: đổi ngày chuyến ----

test('R12: không cho đổi khoảng ngày nếu còn mục nằm ngoài, kể cả mục đã xóa mềm', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const live = await newItem(token, tripId, { day: '2026-08-29' });
    const blocked = await call('PATCH', `/api/trips/${tripId}`, token, { startDate: '2026-08-30' });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.error.code, 'DATES_ORPHAN_ITEMS');
    assert.deepEqual(blocked.body.error.details.dates, ['2026-08-29']);

    // mục đã xóa mềm vẫn chặn (để khôi phục không tạo mục mồ côi)
    await call('DELETE', `/api/trips/${tripId}/items/${live.id}`, token);
    assert.equal((await call('PATCH', `/api/trips/${tripId}`, token, { startDate: '2026-08-30' })).status, 409);

    // xóa vĩnh viễn rồi mới đổi được
    await call('DELETE', `/api/trips/${tripId}/items/${live.id}/permanent`, token);
    const ok = await call('PATCH', `/api/trips/${tripId}`, token, { startDate: '2026-08-30' });
    assert.equal(ok.status, 200);
    assert.equal((await call('GET', `/api/trips/${tripId}`, token)).body.dayCount, 8);
  });
});

test('A-1: đổi tên chuyến không bị R12 chặn; đổi sang khoảng sai bị từ chối', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    await newItem(token, tripId, { day: '2026-08-29' });
    assert.equal((await call('PATCH', `/api/trips/${tripId}`, token, { name: 'Tên mới' })).body.trip.name, 'Tên mới');
    assert.equal((await call('PATCH', `/api/trips/${tripId}`, token, { endDate: '2026-01-01' })).body.error.code, 'END_BEFORE_START');
    assert.equal((await call('PATCH', `/api/trips/${tripId}`, token, { endDate: '2026-09-10' })).status, 200);
  });
});

// ---- Việc cần làm: A-10, D10, P5 ----

test('A-10: chỉ "Việc cần làm" có ô tích; trạng thái giữ khi mở lại', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const task = await newItem(token, tripId, { type: 'task', title: 'In vé' });
    const food = await newItem(token, tripId, { type: 'food', title: 'Phở' });

    assert.equal((await call('PUT', `/api/trips/${tripId}/items/${food.id}/done`, token, { done: true })).body.error.code, 'NOT_A_TASK');
    assert.equal((await call('PUT', `/api/trips/${tripId}/items/${task.id}/done`, token, { done: 'có' })).status, 400);

    const on = await call('PUT', `/api/trips/${tripId}/items/${task.id}/done`, token, { done: true });
    assert.equal(on.body.item.done, true);
    const day = (await call('GET', `/api/trips/${tripId}`, token)).body.days[1].items;
    assert.equal(day.find((i: { id: string }) => i.id === task.id).done, true);
    assert.equal(day.find((i: { id: string }) => i.id === food.id).done, false);

    const off = await call('PUT', `/api/trips/${tripId}/items/${task.id}/done`, token, { done: false });
    assert.equal(off.body.item.done, false);
  });
});

test('A-0 (phần dữ liệu): cùng phiên mở từ thiết bị khác thấy đủ dữ liệu đã lưu phía server', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    await newItem(token, tripId, { title: 'Giữ nguyên', cost: 123 });
    // "thiết bị khác" = một client mới dùng cùng phiên; trạng thái không nằm ở client.
    const other = await call('GET', `/api/trips/${tripId}`, token);
    assert.equal(other.body.days[1].items[0].title, 'Giữ nguyên');
    assert.equal(other.body.totals.extraK, 123);
  });
});

// ---- A-13, A-16 ----

test('A-13: tổng theo ngày và theo loại khớp tổng cả chuyến và cùng quy tắc loại trừ', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    await newItem(token, tripId, { day: '2026-08-30', type: 'food', cost: 100 });
    await newItem(token, tripId, { day: '2026-08-30', type: 'food' }); // chưa biết
    await newItem(token, tripId, { day: '2026-08-31', type: 'lodging', cost: 700 });
    await newItem(token, tripId, { day: '2026-08-31', type: 'tour', cost: 300, included: true, referenceCost: 300 });
    const gone = await newItem(token, tripId, { day: '2026-08-31', type: 'shopping', cost: 999 });
    await call('DELETE', `/api/trips/${tripId}/items/${gone.id}`, token);

    const totals = (await call('GET', `/api/trips/${tripId}`, token)).body.totals;
    assert.equal(totals.extraK, 800);
    const byDay: { date: string; extraK: number }[] = totals.byDay;
    assert.equal(byDay.length, 9); // gồm cả ngày 0 ₫
    assert.equal(byDay.find((d) => d.date === '2026-08-30')!.extraK, 100);
    assert.equal(byDay.find((d) => d.date === '2026-08-31')!.extraK, 700);
    assert.equal(byDay.find((d) => d.date === '2026-09-01')!.extraK, 0);
    assert.equal(byDay.reduce((s, d) => s + d.extraK, 0), totals.extraK);

    const byType: { type: string; extraK: number; extraFormatted: string }[] = totals.byType;
    assert.deepEqual(byType.map((t) => t.type), ['food', 'lodging', 'tour']); // shopping chỉ có mục đã xóa nên không hiện
    assert.equal(byType.find((t) => t.type === 'tour')!.extraK, 0);
    assert.equal(byType.find((t) => t.type === 'lodging')!.extraFormatted, '700.000 ₫');
    assert.equal(byType.reduce((s, t) => s + t.extraK, 0), totals.extraK);
  });
});

test('A-16: danh sách việc cần làm chưa xong khớp ô tích, theo ngày và thứ tự trong ngày', async () => {
  await withApp(async ({ call, newUser, newTrip, newItem }) => {
    const { token } = await newUser();
    const tripId = await newTrip(token);
    const t2 = await newItem(token, tripId, { day: '2026-08-31', type: 'task', title: 'Đổi tiền' });
    const t1a = await newItem(token, tripId, { day: '2026-08-30', type: 'task', title: 'In vé' });
    const t1b = await newItem(token, tripId, { day: '2026-08-30', type: 'task', title: 'Mua thuốc', timeOfDay: '08:00' });
    await newItem(token, tripId, { day: '2026-08-30', type: 'food', title: 'Phở' }); // không phải việc cần làm
    const pending = async () => ((await call('GET', `/api/trips/${tripId}`, token)).body.pendingTasks as { title: string }[]).map((t) => t.title);

    assert.deepEqual(await pending(), ['In vé', 'Mua thuốc', 'Đổi tiền']);
    await call('PUT', `/api/trips/${tripId}/items/${t1a.id}/done`, token, { done: true });
    assert.deepEqual(await pending(), ['Mua thuốc', 'Đổi tiền']);
    // đổi thứ tự trong ngày được phản ánh
    await call('POST', `/api/trips/${tripId}/days/2026-08-30/reorder`, token, {
      orderedIds: [(await call('GET', `/api/trips/${tripId}`, token)).body.days[1].items.map((i: { id: string }) => i.id).reverse()].flat(),
    });
    // mục đã xóa không còn trong danh sách, khôi phục thì quay lại
    await call('DELETE', `/api/trips/${tripId}/items/${t1b.id}`, token);
    assert.deepEqual(await pending(), ['Đổi tiền']);
    await call('POST', `/api/trips/${tripId}/items/${t1b.id}/restore`, token);
    assert.deepEqual(await pending(), ['Mua thuốc', 'Đổi tiền']);
    await call('PUT', `/api/trips/${tripId}/items/${t2.id}/done`, token, { done: true });
    await call('PUT', `/api/trips/${tripId}/items/${t1b.id}/done`, token, { done: true });
    assert.deepEqual(await pending(), []);
  });
});
