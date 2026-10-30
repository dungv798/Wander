import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTripTime, timeOptions } from './tripTime.ts';

test('giờ 24h: nhập nhanh, xóa, giữ phút lẻ và chặn ngoài biên', () => {
  assert.equal(normalizeTripTime('1430'), '14:30');
  assert.equal(normalizeTripTime('00:00'), '00:00');
  assert.equal(normalizeTripTime('2359'), '23:59');
  assert.equal(normalizeTripTime('14:32'), '14:32');
  assert.equal(normalizeTripTime(''), '');
  for (const raw of ['2400', '1260', '143', '1:30', 'abcd']) assert.equal(normalizeTripTime(raw), null);
  assert.deepEqual(timeOptions(60, 5), ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
});
