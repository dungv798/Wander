import test from 'node:test';
import assert from 'node:assert/strict';
import { externalMapHref } from './mapUtil.ts';

test('liên kết bản đồ ngoài trỏ tới ghim đầu tiên; chưa có ghim thì cho thấy cả nước', () => {
  assert.equal(externalMapHref([{ lat: 11.94, lon: 108.44 }]), 'https://www.openstreetmap.org/?mlat=11.94&mlon=108.44#map=13/11.94/108.44');
  assert.equal(externalMapHref([]), 'https://www.openstreetmap.org/#map=6/16.2/106.0');
});
