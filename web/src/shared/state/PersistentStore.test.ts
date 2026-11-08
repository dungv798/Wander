import test from 'node:test';
import assert from 'node:assert/strict';
import { PersistentStore } from './PersistentStore.ts';
import type { KeyValueStorage, Sanitizer } from './PersistentStore.ts';

interface Counter {
  readonly n: number;
}

const INITIAL: Counter = { n: 0 };
const sanitize: Sanitizer<Counter> = (raw) => (typeof raw === 'object' && raw !== null && typeof (raw as Record<string, unknown>)['n'] === 'number' ? { n: (raw as { n: number }).n } : null);

/** Nơi lưu giả trong bộ nhớ. */
function memory(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

test('đọc giá trị hợp lệ đã lưu và ghi lại khi đổi', () => {
  const st = memory({ k: '{"n":5}' });
  const store = new PersistentStore('k', INITIAL, sanitize, st);
  assert.equal(store.getSnapshot().n, 5);
  store.update((s) => ({ n: s.n + 1 }));
  assert.equal(st.data['k'], '{"n":6}');
});

test('dữ liệu hỏng (JSON sai, null, mảng, sai kiểu) rơi về mặc định, không ném lỗi', () => {
  for (const bad of ['{khong-phai-json', 'null', '[1,2]', '{"n":"x"}', '"chuoi"']) {
    assert.deepEqual(new PersistentStore('k', INITIAL, sanitize, memory({ k: bad })).getSnapshot(), INITIAL, bad);
  }
});

test('chạy không lưu khi nơi lưu ném lỗi hoặc không có', () => {
  const broken: KeyValueStorage = {
    getItem: () => {
      throw new Error('chặn');
    },
    setItem: () => {
      throw new Error('đầy');
    },
  };
  const store = new PersistentStore('k', INITIAL, sanitize, broken);
  store.update((s) => ({ n: s.n + 1 }));
  assert.equal(store.getSnapshot().n, 1);
  assert.equal(new PersistentStore('k', INITIAL, sanitize, null).getSnapshot().n, 0);
});

test('người nghe được báo và hủy đăng ký được', () => {
  const store = new PersistentStore('k', INITIAL, sanitize, memory());
  let calls = 0;
  const off = store.subscribe(() => {
    calls += 1;
  });
  store.update((s) => ({ n: s.n + 1 }));
  off();
  store.update((s) => ({ n: s.n + 1 }));
  assert.equal(calls, 1);
});
test('cổng nguyên văn giữ dữ liệu cũ: chuỗi thuần, JSON và khóa không đổi', () => {
  const data = new Map([['destination', 'da-lat'], ['gaps', '["lunch"]']]);
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  assert.equal(PersistentStore.readRaw('destination', storage), 'da-lat');
  assert.equal(PersistentStore.readRaw('gaps', storage), '["lunch"]');
  PersistentStore.writeRaw('destination', 'ha-giang', storage);
  assert.equal(data.get('destination'), 'ha-giang');
  PersistentStore.writeRaw('gaps', '["dinner"]', storage);
  assert.equal(data.get('gaps'), '["dinner"]');
});

test('cổng nguyên văn chịu kho bị chặn hoặc không có storage', () => {
  const blocked = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); } };
  assert.equal(PersistentStore.readRaw('key', blocked), null);
  assert.doesNotThrow(() => PersistentStore.writeRaw('key', 'value', blocked));
  assert.equal(PersistentStore.readRaw('key', null), null);
  assert.doesNotThrow(() => PersistentStore.writeRaw('key', 'value', null));
});
