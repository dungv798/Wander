import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dayLabel, fullDate, inclusiveDays, nextWeekday, parseIsoDate, todayLocal } from './dates.ts';

test('parseIsoDate từ chối ngày không có thật', () => {
  assert.equal(parseIsoDate('2026-02-30'), null);
  assert.equal(parseIsoDate('31/10/2026'), null);
  assert.notEqual(parseIsoDate('2028-02-29'), null);
});

test('inclusiveDays tính cả hai đầu (R5)', () => {
  assert.equal(inclusiveDays('2026-08-29', '2026-09-06'), 9);
  assert.equal(inclusiveDays('2026-10-31', '2026-10-31'), 1);
});

test('addDays qua tháng và năm', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('nhãn ngày theo thứ', () => {
  assert.equal(dayLabel('2026-10-31'), 'T7 31/10');
  assert.equal(fullDate('2026-10-31'), 'T7, 31/10/2026');
  assert.equal(fullDate(null), '');
});

test('todayLocal lấy ngày lịch của máy', () => {
  assert.equal(todayLocal(new Date(2026, 9, 31, 23, 59)), '2026-10-31');
});

test('nextWeekday: thứ Bảy tới luôn sau ngày hiện tại, kể cả khi hôm nay là thứ Bảy', () => {
  assert.equal(nextWeekday('2026-10-26', 6), '2026-10-31');
  assert.equal(nextWeekday('2026-10-31', 6), '2026-11-07');
  assert.equal(nextWeekday('2026-10-30', 6), '2026-10-31');
});
