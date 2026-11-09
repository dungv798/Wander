import test from 'node:test';
import assert from 'node:assert/strict';
import { isToolbarCollapsed, shouldEnableFullscreen } from './fullscreen.ts';
import { FULLSCREEN } from '../shared/const/fullscreen.const.ts';

test('đã coi là thu thanh khi trang cuộn tới ngưỡng, chưa thì chưa', () => {
  assert.equal(isToolbarCollapsed(0), false);
  assert.equal(isToolbarCollapsed(FULLSCREEN.COLLAPSED_SCROLL_PX - 1), false);
  assert.equal(isToolbarCollapsed(FULLSCREEN.COLLAPSED_SCROLL_PX), true);
  assert.equal(isToolbarCollapsed(FULLSCREEN.SCROLL_RANGE_PX), true);
});


const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

test('chưa chọn gì: mặc định BẬT trên Safari iPhone, tắt ở Chrome iOS và Android', () => {
  assert.equal(shouldEnableFullscreen(null, IPHONE_SAFARI, false), true);
  assert.equal(shouldEnableFullscreen(null, IPHONE_CHROME, false), false);
  assert.equal(shouldEnableFullscreen(null, ANDROID_CHROME, false), false);
});

test('đã thêm vào màn hình chính (standalone) thì mặc định tắt vì không còn thanh để thu', () => {
  assert.equal(shouldEnableFullscreen(null, IPHONE_SAFARI, true), false);
});

test('lựa chọn của người dùng luôn thắng mặc định: ?fs=0 tắt trên Safari iPhone, ?fs=1 bật ở chỗ khác', () => {
  assert.equal(shouldEnableFullscreen(false, IPHONE_SAFARI, false), false);
  assert.equal(shouldEnableFullscreen(true, ANDROID_CHROME, false), true);
});
