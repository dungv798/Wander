import test from 'node:test';
import assert from 'node:assert/strict';
import { readTrialLook } from './look.ts';
import { LOOK } from '../shared/const/look.const.ts';

/** Kho giả chỉ dành cho lựa chọn thử nghiệm, không đụng dữ liệu ứng dụng. */
function memory() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

test('mặc định tắt; URL ngoài/hash lưu lựa chọn và đọc lại sau tải trang', () => {
  const storage = memory();
  assert.equal(readTrialLook({ search: '', hash: '#/' }, storage), null);
  assert.equal(readTrialLook({ search: '', hash: '#/deck/ha-giang?look=jakarta' }, storage), 'jakarta');
  assert.equal(storage.getItem(LOOK.STORAGE), 'jakarta');
  assert.equal(readTrialLook({ search: '', hash: '#/' }, storage), 'jakarta');
  assert.equal(readTrialLook({ search: '?look=nunito', hash: '#/?look=lexend' }, storage), 'nunito');
  assert.equal(readTrialLook({ search: '?look=off', hash: '#/' }, storage), null);
  assert.equal(storage.getItem(LOOK.STORAGE), null);
});

test('kho bị chặn, dữ liệu lạ và giá trị URL lạ không phá khởi động', () => {
  const storage = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); }, removeItem: () => { throw new Error(); } };
  assert.equal(readTrialLook({ search: '?look=lexend', hash: '' }, storage), 'lexend');
  assert.equal(readTrialLook({ search: '?look=off', hash: '' }, storage), null);
  assert.equal(readTrialLook({ search: '?look=unknown', hash: '' }, storage), null);
  assert.equal(readTrialLook({ search: '', hash: '' }, null), null);
  const bad = memory();
  bad.setItem(LOOK.STORAGE, 'unknown');
  assert.equal(readTrialLook({ search: '', hash: '' }, bad), null);
});
