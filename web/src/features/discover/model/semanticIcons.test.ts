import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_ICON, VERDICT_STYLE } from './discover.const.ts';

test('chợ giữ Tabler; chỉ ghé nếu tiện dùng thông tin thay đồng hồ bấm giờ', () => {
  assert.equal(CATEGORY_ICON.cho, 'building-store');
  assert.equal(VERDICT_STYLE.ifconv.icon, 'info-circle');
});
