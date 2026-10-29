import test from 'node:test';
import assert from 'node:assert/strict';
import { dismissSheetHint, rememberedSnap, rememberSnap, sheetMemoryKey, shouldShowSheetHint } from './sheetMemory.ts';

test('đổi tab hoặc bỏ tab trong URL vẫn nhớ cùng nấc; chuyến khác giữ mặc định', () => {
  const key = sheetMemoryKey('#/trip/a');
  rememberSnap(key, 'full');
  assert.equal(rememberedSnap(sheetMemoryKey('#/trip/a/2'), 'half'), 'full');
  assert.equal(rememberedSnap(sheetMemoryKey('#/trip/b/ov'), 'half'), 'half');
  for (const snap of ['peek', 'half', 'full'] as const) {
    rememberSnap(key, snap);
    assert.equal(rememberedSnap(sheetMemoryKey('#/trip/a/ov'), 'half'), snap);
  }
});

test('lời mời chỉ hiện trước cử chỉ đầu; storage bị chặn không ném lỗi', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  assert.equal(shouldShowSheetHint(storage), true);
  dismissSheetHint(storage);
  assert.equal(shouldShowSheetHint(storage), false);
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(shouldShowSheetHint(blocked), true);
  assert.doesNotThrow(() => dismissSheetHint(blocked));
});
