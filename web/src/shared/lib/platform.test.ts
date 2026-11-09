import test from 'node:test';
import assert from 'node:assert/strict';
import { isIosSafari, isStandalone } from './platform.ts';

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';
const IPHONE_FIREFOX = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15';

test('Safari trên iPhone/iPad được nhận ra; Chrome, Firefox iOS, Android và Safari máy Mac thì không', () => {
  assert.equal(isIosSafari(IPHONE_SAFARI), true);
  assert.equal(isIosSafari(IPHONE_SAFARI.replace('iPhone; CPU iPhone', 'iPad; CPU')), true);
  assert.equal(isIosSafari(IPHONE_CHROME), false);
  assert.equal(isIosSafari(IPHONE_FIREFOX), false);
  assert.equal(isIosSafari(ANDROID_CHROME), false);
  assert.equal(isIosSafari(MAC_SAFARI), false);
});

test('standalone: display-mode hoặc navigator.standalone đều báo đã chạy từ màn hình chính', () => {
  assert.equal(isStandalone({ displayModeStandalone: false, navigatorStandalone: undefined }), false);
  assert.equal(isStandalone({ displayModeStandalone: false, navigatorStandalone: false }), false);
  assert.equal(isStandalone({ displayModeStandalone: true, navigatorStandalone: undefined }), true);
  assert.equal(isStandalone({ displayModeStandalone: false, navigatorStandalone: true }), true);
});
