import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeviceName } from './deviceName.ts';
import { IDENTITY } from './identity.const.ts';

test('tên thiết bị: cắt khoảng trắng, không rỗng, không quá dài', () => {
  assert.deepEqual(parseDeviceName('  Điện thoại của Dũng '), { ok: true, value: 'Điện thoại của Dũng' });
  assert.equal(parseDeviceName('   ').ok, false);
  assert.equal(parseDeviceName('x'.repeat(IDENTITY.MAX_DEVICE_NAME)).ok, true);
  const long = parseDeviceName('x'.repeat(IDENTITY.MAX_DEVICE_NAME + 1));
  assert.equal(long.ok, false);
  if (!long.ok) assert.match(long.error, /40/);
});
