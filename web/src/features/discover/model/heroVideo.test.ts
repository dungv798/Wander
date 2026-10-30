import test from 'node:test';
import assert from 'node:assert/strict';
import { canShowHeroVideo } from './heroVideo.ts';

test('hero dùng ảnh khi giảm chuyển động, tiết kiệm dữ liệu hoặc màn hẹp', () => {
  assert.equal(canShowHeroVideo({ reducedMotion: false, width: 390 }), true);
  assert.equal(canShowHeroVideo({ reducedMotion: true, width: 390 }), false);
  assert.equal(canShowHeroVideo({ reducedMotion: false, saveData: true, width: 1440 }), false);
  assert.equal(canShowHeroVideo({ reducedMotion: false, width: 359 }), false);
  assert.equal(canShowHeroVideo({ reducedMotion: false, saveData: false, width: 360 }), true);
});
