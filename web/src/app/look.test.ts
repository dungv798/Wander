import test from 'node:test';
import assert from 'node:assert/strict';
import { readClassicLook } from './look.ts';
import { LOOK } from '../shared/const/look.const.ts';

/** Kho giả chỉ dành cho lựa chọn thử nghiệm, không đụng dữ liệu ứng dụng. */
function memory() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

test('mặc định tắt; URL ngoài/hash lưu lựa chọn và đọc lại sau tải trang', () => {
  const storage = memory();
  assert.equal(readClassicLook({ search: '', hash: '#/' }, storage), false);
  assert.equal(readClassicLook({ search: '', hash: '#/deck/ha-giang?look=classic' }, storage), true);
  assert.equal(storage.getItem(LOOK.STORAGE), 'classic');
  assert.equal(readClassicLook({ search: '', hash: '#/' }, storage), true);
  assert.equal(readClassicLook({ search: '?look=classic', hash: '#/?look=classic' }, storage), true);
  assert.equal(readClassicLook({ search: '?look=off', hash: '#/' }, storage), false);
  assert.equal(storage.getItem(LOOK.STORAGE), null);
});

test('kho bị chặn, dữ liệu lạ và giá trị URL lạ không phá khởi động', () => {
  const storage = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); }, removeItem: () => { throw new Error(); } };
  assert.equal(readClassicLook({ search: '?look=classic', hash: '' }, storage), true);
  assert.equal(readClassicLook({ search: '?look=off', hash: '' }, storage), false);
  assert.equal(readClassicLook({ search: '?look=unknown', hash: '' }, storage), false);
  assert.equal(readClassicLook({ search: '', hash: '' }, null), false);
  const bad = memory();
  bad.setItem(LOOK.STORAGE, 'unknown');
  assert.equal(readClassicLook({ search: '', hash: '' }, bad), false);
});
