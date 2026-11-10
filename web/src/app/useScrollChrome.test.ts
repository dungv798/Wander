import test from 'node:test';
import assert from 'node:assert/strict';
import { nextChromeHidden } from './useScrollChrome.ts';
import { SCROLL_CHROME } from './scrollChrome.const.ts';

const MAX = 3000;

test('gần đầu trang thanh luôn hiện và điểm đảo chiều theo vị trí', () => {
  const r = nextChromeHidden({ y: SCROLL_CHROME.ALWAYS_SHOW_ABOVE_PX, max: MAX, anchor: 0, hidden: true });
  assert.deepEqual(r, { hidden: false, anchor: SCROLL_CHROME.ALWAYS_SHOW_ABOVE_PX });
});

test('cuộn xuống chưa đủ ngưỡng thì chưa ẩn; đủ ngưỡng thì ẩn', () => {
  const start = 400;
  assert.equal(nextChromeHidden({ y: start + SCROLL_CHROME.HIDE_AFTER_DOWN_PX - 1, max: MAX, anchor: start, hidden: false }).hidden, false);
  assert.equal(nextChromeHidden({ y: start + SCROLL_CHROME.HIDE_AFTER_DOWN_PX, max: MAX, anchor: start, hidden: false }).hidden, true);
});

test('đang ẩn: cuộn xuống tiếp vẫn ẩn; cuộn lên đủ ngưỡng thì hiện lại', () => {
  const down = nextChromeHidden({ y: 900, max: MAX, anchor: 800, hidden: true });
  assert.deepEqual(down, { hidden: true, anchor: 900 });
  assert.equal(nextChromeHidden({ y: 900 - SCROLL_CHROME.SHOW_AFTER_UP_PX + 1, max: MAX, anchor: 900, hidden: true }).hidden, true);
  assert.equal(nextChromeHidden({ y: 900 - SCROLL_CHROME.SHOW_AFTER_UP_PX, max: MAX, anchor: 900, hidden: true }).hidden, false);
});

test('chạm cuối trang thì hiện thanh để chạm được tab', () => {
  assert.equal(nextChromeHidden({ y: MAX - SCROLL_CHROME.ALWAYS_SHOW_NEAR_END_PX, max: MAX, anchor: 2900, hidden: true }).hidden, false);
});

test('kéo giãn quá đầu hoặc đáy (rubber-band) không đổi trạng thái', () => {
  assert.deepEqual(nextChromeHidden({ y: -30, max: MAX, anchor: 500, hidden: true }), { hidden: true, anchor: 500 });
  assert.deepEqual(nextChromeHidden({ y: MAX + 40, max: MAX, anchor: 500, hidden: false }), { hidden: false, anchor: 500 });
});

test('đang hiện: cuộn lên kéo điểm đảo chiều theo để lần xuống sau tính lại từ đó', () => {
  assert.deepEqual(nextChromeHidden({ y: 600, max: MAX, anchor: 700, hidden: false }), { hidden: false, anchor: 600 });
});
