import assert from 'node:assert/strict';
import test from 'node:test';
import { isVenueView } from './venue.ts';

const venue = { kind: 'cafe', kindName: 'Quán cà phê', address: '39 Nguyễn Hữu Huân', website: 'https://cafegiang.vn/', sourceUrl: 'https://cafegiang.vn/', checkedAt: '2026-11-07' };
test('metadata quán đủ nguồn được nhận, website có thể chưa biết', () => {
  assert.ok(isVenueView(venue));
  assert.ok(isVenueView({ ...venue, website: '' }));
});
test('không biến URL nguy hiểm hoặc hồ sơ thiếu địa chỉ/nguồn thành hành động', () => {
  for (const change of [{ website: 'javascript:alert(1)' }, { sourceUrl: 'https://user:pass@example.org' }, { address: '' }, { kind: 'other' }, { checkedAt: 'hôm nay' }]) {
    assert.equal(isVenueView({ ...venue, ...change }), false);
  }
});

test('đọc giờ, số liên hệ và giá có nguồn; không nhận trường thực dụng sai kiểu', () => {
  assert.ok(isVenueView({ ...venue, kind: 'bar', phone: '+84 24 1234 5678', serviceHours: 'T2–CN 18:00–23:00', priceNote: 'Theo thực đơn' }));
  for (const change of [{ phone: 123 }, { serviceHours: [] }, { priceNote: {} }]) assert.equal(isVenueView({ ...venue, ...change }), false);
});
