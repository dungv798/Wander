import test from 'node:test';
import assert from 'node:assert/strict';
import { DateRange, DateRangeError } from './DateRange.ts';

/** Collects the error code of a computation; 'OK' if there is no error. */
const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DateRangeError) return e.code;
  }
  return 'OK';
};

test('khoảng ngày gồm hai đầu', () => {
  const r = DateRange.of('2026-10-31', '2026-11-02');
  assert.equal(r.length, 3);
  assert.deepEqual(r.days(), ['2026-10-31', '2026-11-01', '2026-11-02']);
  assert.equal(r.contains('2026-11-02'), true);
  assert.equal(r.contains('2026-11-03'), false);
});

test('chặn thiếu ngày, sai thứ tự, quá 366 ngày', () => {
  assert.equal(codeOf(() => DateRange.of('', '2026-11-02')), 'START_REQUIRED');
  assert.equal(codeOf(() => DateRange.of('2026-11-02', '')), 'END_REQUIRED');
  assert.equal(codeOf(() => DateRange.of('2026-11-02', '2026-11-01')), 'END_BEFORE_START');
  assert.equal(codeOf(() => DateRange.of('2026-01-01', '2027-01-02')), 'TOO_MANY_DAYS');
  assert.equal(codeOf(() => DateRange.of('2026-01-01', '2027-01-01')), 'OK');
  assert.equal(codeOf(() => DateRange.of('2026-02-30', '2026-03-01')), 'INVALID_DATE');
});
