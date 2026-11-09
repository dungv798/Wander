import test from 'node:test';
import assert from 'node:assert/strict';
import { pickDevice } from './pick-device.mjs';

const SAMPLE = {
  'com.apple.CoreSimulator.SimRuntime.iOS-17-5': [{ name: 'iPhone 15 Pro', udid: 'A15', isAvailable: true }],
  'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [{ name: 'iPhone 16 Pro', udid: 'B16', isAvailable: true }, { name: 'iPhone 16', udid: 'C16', isAvailable: true }],
  'com.apple.CoreSimulator.SimRuntime.watchOS-11-0': [{ name: 'Apple Watch', udid: 'W', isAvailable: true }],
};

test('đúng tên máy thì chọn đúng máy (bản iOS mới nhất nếu trùng tên)', () => {
  assert.equal(pickDevice(SAMPLE, 'iPhone 16 Pro'), 'B16');
  assert.equal(pickDevice(SAMPLE, 'iPhone 15 Pro'), 'A15');
});
test('tên không có thì lấy iPhone Pro mới nhất, và không bao giờ chọn máy không phải iOS', () => {
  assert.equal(pickDevice(SAMPLE, 'iPhone 99'), 'B16');
  assert.notEqual(pickDevice(SAMPLE, 'Apple Watch'), 'W');
});
test('máy không sẵn sàng bị bỏ qua; không có máy nào thì báo lỗi', () => {
  assert.equal(pickDevice({ 'x.iOS-18-0': [{ name: 'iPhone 16 Pro', udid: 'X', isAvailable: false }, { name: 'iPhone 16', udid: 'Y', isAvailable: true }] }, 'iPhone 16 Pro'), 'Y');
  assert.throws(() => pickDevice({}, 'iPhone 16'), /Không có máy ảo/);
});
