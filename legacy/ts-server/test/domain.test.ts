import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCostK, formatVndFromK, totalExtraK, buildCostFields, MAX_COST_K } from '../src/domain/money.ts';
import { validateTripRange, listDays, dayCount, datesOutsideRange, isDateInRange } from '../src/domain/trip.ts';
import {
  ITEM_TYPES,
  ITEM_TYPE_LABELS,
  parseTitle,
  parseTimeOfDay,
  parseDurationMin,
  validateReorder,
  insertAt,
} from '../src/domain/items.ts';

// ---- Tiền: D17, D18, R2–R4 ----

test('R3: chi phí trống là chưa biết, 0 là đã biết bằng 0', () => {
  assert.deepEqual(parseCostK(''), { ok: true, value: null });
  assert.deepEqual(parseCostK('   '), { ok: true, value: null });
  assert.deepEqual(parseCostK(null), { ok: true, value: null });
  assert.deepEqual(parseCostK(undefined), { ok: true, value: null });
  assert.deepEqual(parseCostK(0), { ok: true, value: 0 });
  assert.deepEqual(parseCostK('0'), { ok: true, value: 0 });
});

test('R3: chấp nhận số nguyên không âm theo nghìn đồng', () => {
  assert.deepEqual(parseCostK(150), { ok: true, value: 150 });
  assert.deepEqual(parseCostK(' 1500 '), { ok: true, value: 1500 });
  assert.deepEqual(parseCostK('007'), { ok: true, value: 7 });
  assert.deepEqual(parseCostK(MAX_COST_K), { ok: true, value: MAX_COST_K });
});

test('R3: chặn giá trị âm', () => {
  assert.deepEqual(parseCostK(-1), { ok: false, error: 'NEGATIVE' });
  assert.deepEqual(parseCostK('-5'), { ok: false, error: 'NEGATIVE' });
});

test('R3: chặn định dạng sai, kể cả số thập phân và dấu phân cách', () => {
  for (const bad of ['1.5', '1,5', '1.500', '12abc', 'abc', '1e3', '₫100', '1 000', '--1', '+5']) {
    assert.deepEqual(parseCostK(bad), { ok: false, error: 'MALFORMED' }, `phải chặn ${JSON.stringify(bad)}`);
  }
  assert.deepEqual(parseCostK(1.5), { ok: false, error: 'MALFORMED' });
  assert.deepEqual(parseCostK(Number.NaN), { ok: false, error: 'MALFORMED' });
  assert.deepEqual(parseCostK(Number.POSITIVE_INFINITY), { ok: false, error: 'MALFORMED' });
  assert.deepEqual(parseCostK({}), { ok: false, error: 'MALFORMED' });
  assert.deepEqual(parseCostK(true), { ok: false, error: 'MALFORMED' });
});

test('R3: chặn giá trị vượt mức tối đa', () => {
  assert.deepEqual(parseCostK(MAX_COST_K + 1), { ok: false, error: 'TOO_LARGE' });
  assert.deepEqual(parseCostK('99999999999999999999'), { ok: false, error: 'TOO_LARGE' });
});

test('D17: hiển thị VND đầy đủ', () => {
  assert.equal(formatVndFromK(0), '0 ₫');
  assert.equal(formatVndFromK(150), '150.000 ₫');
  assert.equal(formatVndFromK(1500), '1.500.000 ₫');
});

const live = { deletedAt: null as string | null, included: false, referenceK: null as number | null };

test('R2/R4: tổng chỉ cộng chi phí số của mục còn hiện', () => {
  const total = totalExtraK([
    { ...live, costK: 100 },
    { ...live, costK: 0 },
    { ...live, costK: 250 },
  ]);
  assert.equal(total, 350);
});

test('R2: mục chưa biết (trống) không được cộng và không làm hỏng tổng', () => {
  assert.equal(totalExtraK([{ ...live, costK: null }, { ...live, costK: 40 }]), 40);
  assert.equal(totalExtraK([{ ...live, costK: null }]), 0);
});

test('D18: khoản đã bao gồm không cộng vào tổng, kể cả giá tham khảo và chi phí', () => {
  const total = totalExtraK([
    { ...live, costK: 300 },
    { ...live, included: true, costK: null, referenceK: 500 },
    { ...live, included: true, costK: 200, referenceK: 200 },
  ]);
  assert.equal(total, 300);
});

test('R2/R7: mục đã xóa mềm không tính vào tổng', () => {
  const total = totalExtraK([
    { ...live, costK: 100 },
    { ...live, costK: 900, deletedAt: '2026-10-23T10:00:00.000Z' },
  ]);
  assert.equal(total, 100);
});

test('buildCostFields: giá tham khảo chỉ hợp lệ khi đã tick "đã bao gồm"', () => {
  assert.deepEqual(buildCostFields(null, true, 500), {
    ok: true,
    value: { costK: null, included: true, referenceK: 500 },
  });
  assert.deepEqual(buildCostFields(100, false, 500), {
    ok: false,
    error: { field: 'referenceCost', code: 'REFERENCE_REQUIRES_INCLUDED' },
  });
  assert.deepEqual(buildCostFields(-1, false, null), { ok: false, error: { field: 'cost', code: 'NEGATIVE' } });
  assert.deepEqual(buildCostFields(null, true, '1.5'), {
    ok: false,
    error: { field: 'referenceCost', code: 'MALFORMED' },
  });
});

// ---- Chuyến và ngày: A-1, A-2, R1, R5, R12 ----

test('A-1: thiếu ngày đi hoặc ngày về thì không tạo được; ngày về không trước ngày đi', () => {
  assert.deepEqual(validateTripRange(undefined, '2026-09-06'), { ok: false, error: 'START_REQUIRED' });
  assert.deepEqual(validateTripRange('2026-08-29', ''), { ok: false, error: 'END_REQUIRED' });
  assert.deepEqual(validateTripRange('2026-09-06', '2026-08-29'), { ok: false, error: 'END_BEFORE_START' });
  assert.deepEqual(validateTripRange('2026-02-30', '2026-03-01'), { ok: false, error: 'INVALID_DATE' });
  assert.deepEqual(validateTripRange('29/08/2026', '2026-09-06'), { ok: false, error: 'INVALID_DATE' });
  assert.deepEqual(validateTripRange('2026-08-29', '2026-08-29'), { ok: true });
  assert.deepEqual(validateTripRange('2026-08-29', '2026-09-06'), { ok: true });
});

test('A-1: chuyến quá dài bị chặn', () => {
  assert.deepEqual(validateTripRange('2026-01-01', '2027-01-02'), { ok: false, error: 'TOO_LONG' });
  assert.deepEqual(validateTripRange('2026-01-01', '2026-12-31'), { ok: true });
});

test('R5: số ngày gồm hai đầu (chuyến thật 29/08–06/09/2026 là 9 ngày)', () => {
  assert.equal(dayCount('2026-08-29', '2026-09-06'), 9);
  assert.equal(dayCount('2026-08-29', '2026-08-29'), 1);
});

test('R1/A-2: mỗi ngày lịch có một ngày kèm thứ trong tuần', () => {
  const days = listDays('2026-08-29', '2026-09-06');
  assert.equal(days.length, 9);
  assert.deepEqual(days[0], { date: '2026-08-29', index: 1, weekday: 6, weekdayLabel: 'T7' });
  assert.equal(days[1]?.weekdayLabel, 'CN');
  assert.equal(days[2]?.weekdayLabel, 'T2');
  assert.equal(days[8]?.date, '2026-09-06');
  assert.equal(days[8]?.weekdayLabel, 'CN');
});

test('R1: qua tháng và năm nhuận vẫn đúng ngày', () => {
  const days = listDays('2028-02-28', '2028-03-01');
  assert.deepEqual(
    days.map((d) => d.date),
    ['2028-02-28', '2028-02-29', '2028-03-01'],
  );
});

test('R12: phát hiện mục nằm ngoài khoảng mới', () => {
  assert.deepEqual(datesOutsideRange(['2026-08-29', '2026-09-02'], '2026-08-30', '2026-09-06'), ['2026-08-29']);
  assert.deepEqual(datesOutsideRange(['2026-08-30'], '2026-08-30', '2026-09-06'), []);
  assert.deepEqual(datesOutsideRange(['2026-09-07', '2026-09-07'], '2026-08-30', '2026-09-06'), ['2026-09-07']);
  assert.equal(isDateInRange('2026-09-06', '2026-08-30', '2026-09-06'), true);
  assert.equal(isDateInRange('2026-09-07', '2026-08-30', '2026-09-06'), false);
});

// ---- Mục: A-3…A-5, D13, D16 ----

test('A-4: có đủ 9 loại và nhãn tiếng Việt, gồm Nghỉ và Việc cần làm', () => {
  assert.equal(ITEM_TYPES.length, 9);
  assert.equal(ITEM_TYPE_LABELS.rest, 'Nghỉ');
  assert.equal(ITEM_TYPE_LABELS.task, 'Việc cần làm');
  for (const t of ITEM_TYPES) assert.ok(ITEM_TYPE_LABELS[t].length > 0);
});

test('A-3: tiêu đề bắt buộc; giờ, thời lượng, ghi chú tùy chọn', () => {
  assert.deepEqual(parseTitle('  Cột cờ Lũng Cú '), { ok: true, value: 'Cột cờ Lũng Cú' });
  assert.deepEqual(parseTitle('   '), { ok: false, error: 'REQUIRED' });
  assert.deepEqual(parseTitle(undefined), { ok: false, error: 'REQUIRED' });
  assert.deepEqual(parseTitle('x'.repeat(201)), { ok: false, error: 'TOO_LONG' });
});

test('D16: giờ và thời lượng có thể để trống', () => {
  assert.deepEqual(parseTimeOfDay(''), { ok: true, value: null });
  assert.deepEqual(parseTimeOfDay(undefined), { ok: true, value: null });
  assert.deepEqual(parseTimeOfDay('07:30'), { ok: true, value: '07:30' });
  assert.deepEqual(parseTimeOfDay('24:00'), { ok: false, error: 'OUT_OF_RANGE' });
  assert.deepEqual(parseTimeOfDay('7:30'), { ok: false, error: 'MALFORMED' });
  assert.deepEqual(parseDurationMin(''), { ok: true, value: null });
  assert.deepEqual(parseDurationMin(90), { ok: true, value: 90 });
  assert.deepEqual(parseDurationMin('45'), { ok: true, value: 45 });
  assert.deepEqual(parseDurationMin(-1), { ok: false, error: 'OUT_OF_RANGE' });
  assert.deepEqual(parseDurationMin(1.5), { ok: false, error: 'MALFORMED' });
});

test('D16/R6: sắp xếp thủ công phải là hoán vị của các mục hiện có', () => {
  assert.equal(validateReorder(['a', 'b', 'c'], ['c', 'a', 'b']), true);
  assert.equal(validateReorder(['a', 'b', 'c'], ['a', 'b']), false);
  assert.equal(validateReorder(['a', 'b', 'c'], ['a', 'b', 'd']), false);
  assert.equal(validateReorder(['a', 'b', 'c'], ['a', 'a', 'b']), false);
});

test('insertAt: chèn tại vị trí, kẹp vào biên, không nhân đôi', () => {
  assert.deepEqual(insertAt(['a', 'b', 'c'], 'x', 1), ['a', 'x', 'b', 'c']);
  assert.deepEqual(insertAt(['a', 'b'], 'x', 99), ['a', 'b', 'x']);
  assert.deepEqual(insertAt(['a', 'b'], 'x', -3), ['x', 'a', 'b']);
  assert.deepEqual(insertAt(['a', 'b', 'c'], 'c', 0), ['c', 'a', 'b']);
});

// ---- A-13: tổng theo nhóm ----

test('A-13: tổng theo nhóm dùng cùng quy tắc loại trừ và cộng lại đúng bằng tổng chung', async () => {
  const { totalsByKey } = await import('../src/domain/money.ts');
  const items = [
    { ...live, day: 'd1', type: 'food', costK: 100 },
    { ...live, day: 'd1', type: 'food', costK: null }, // chưa biết
    { ...live, day: 'd1', type: 'tour', costK: 500, included: true, referenceK: 500 }, // đã bao gồm
    { ...live, day: 'd2', type: 'food', costK: 40 },
    { ...live, day: 'd2', type: 'lodging', costK: 900, deletedAt: '2026-10-23T00:00:00.000Z' }, // đã xóa
    { ...live, day: 'd2', type: 'lodging', costK: 0 },
  ];
  const byDay = totalsByKey(items, (i) => i.day);
  const byType = totalsByKey(items, (i) => i.type);
  assert.equal(byDay.get('d1'), 100);
  assert.equal(byDay.get('d2'), 40);
  assert.equal(byType.get('food'), 140);
  assert.equal(byType.get('tour'), 0);
  assert.equal(byType.get('lodging'), 0);
  const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum(byDay), totalExtraK(items));
  assert.equal(sum(byType), totalExtraK(items));
});
