import test from 'node:test';
import assert from 'node:assert/strict';
import { readUrlFlag } from './urlFlag.ts';
import type { UrlFlagSpec } from './urlFlag.ts';

const SPEC: UrlFlagSpec = { param: 'fs', storageKey: 'k', on: '1', off: '0' };

/** Kho giả đủ hai thao tác dùng. */
function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

test('?fs=1 bật và ghi nhớ; lần sau không có tham số vẫn bật', () => {
  const store = memory();
  assert.equal(readUrlFlag(SPEC, { search: '?fs=1', hash: '#/' }, store), true);
  assert.equal(store.data.get('k'), '1');
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '#/dest/ha-giang' }, store), true);
});

test('?fs=0 tắt và GHI NHỚ "tắt" (để thoát được khi mặc định là bật)', () => {
  const store = memory({ k: '1' });
  assert.equal(readUrlFlag(SPEC, { search: '?fs=0', hash: '' }, store), false);
  assert.equal(store.data.get('k'), '0');
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '' }, store), false);
});

test('chưa chọn gì (không tham số, kho trống) thì trả null để nơi gọi quyết định mặc định', () => {
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '' }, memory()), null);
  assert.equal(readUrlFlag(SPEC, { search: '?fs=abc', hash: '' }, memory()), null, 'giá trị lạ không tính là lựa chọn');
});

test('tham số trong hash cũng được nhận', () => {
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '#/?fs=1' }, memory()), true);
});

test('kho null hoặc ném lỗi thì chỉ theo URL, không văng', () => {
  assert.equal(readUrlFlag(SPEC, { search: '?fs=1', hash: '' }, null), true);
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '' }, null), null);
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(readUrlFlag(SPEC, { search: '?fs=0', hash: '' }, broken), false);
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '' }, broken), null);
});
