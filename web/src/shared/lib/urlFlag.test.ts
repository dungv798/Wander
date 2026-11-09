import test from 'node:test';
import assert from 'node:assert/strict';
import { readUrlFlag } from './urlFlag.ts';
import type { UrlFlagSpec } from './urlFlag.ts';

const SPEC: UrlFlagSpec = { param: 'fs', storageKey: 'k', on: '1', off: '0' };

/** Kho giả đủ ba thao tác. */
function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
}

test('?fs=1 bật và ghi nhớ; lần sau không có tham số vẫn bật', () => {
  const store = memory();
  assert.equal(readUrlFlag(SPEC, { search: '?fs=1', hash: '#/' }, store), true);
  assert.equal(store.data.get('k'), '1');
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '#/dest/ha-giang' }, store), true);
});

test('?fs=0 tắt và xóa giá trị đã nhớ', () => {
  const store = memory({ k: '1' });
  assert.equal(readUrlFlag(SPEC, { search: '?fs=0', hash: '' }, store), false);
  assert.equal(store.data.has('k'), false);
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '' }, store), false);
});

test('tham số trong hash cũng được nhận; giá trị lạ không bật', () => {
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '#/?fs=1' }, memory()), true);
  assert.equal(readUrlFlag(SPEC, { search: '?fs=abc', hash: '' }, memory({ k: '1' })), false);
});

test('kho null hoặc ném lỗi thì chỉ theo URL, không văng', () => {
  assert.equal(readUrlFlag(SPEC, { search: '?fs=1', hash: '' }, null), true);
  assert.equal(readUrlFlag(SPEC, { search: '', hash: '' }, null), false);
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
  assert.equal(readUrlFlag(SPEC, { search: '?fs=1', hash: '' }, broken), true);
});
