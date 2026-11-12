import test from 'node:test';
import assert from 'node:assert/strict';
import type { Trip } from '../../trips/index.ts';
import type { DestinationDetail } from './Catalog.types.ts';
import { heroImages, homeTrip, resumeKind } from './homeSelection.ts';

test('ảnh hero không có tuyển chọn dùng ảnh bìa, không tự đưa ảnh chưa chấm vào', () => {
  const dest = { coverUrl: 'cover', places: ['cover', '', 'a', 'b', 'c', 'd'].map(url => ({ photos: [{ url }] })) } as unknown as DestinationDetail;
  assert.deepEqual(heroImages(dest), ['cover']);
  assert.deepEqual(heroImages({ coverUrl: '', places: [] } as unknown as DestinationDetail), []);
  assert.deepEqual(heroImages({ coverUrl: 'cover', places: [] } as unknown as DestinationDetail), ['cover']);
});

test('ảnh đã chọn chỉ hiện khi còn trong catalog và giữ thứ tự xếp hạng', () => {
  const dest = { id: 'da-lat', coverUrl: 'cover', places: [{ photos: [{ url: '/catalog/photos/ho-xuan-huong-2-w1280-9d989b3de5.webp' }, { url: '/catalog/photos/ho-tuyen-lam-1-w1280-0c24449240.webp' }] }] } as unknown as DestinationDetail;
  assert.deepEqual(heroImages(dest), ['/catalog/photos/ho-tuyen-lam-1-w1280-0c24449240.webp', '/catalog/photos/ho-xuan-huong-2-w1280-9d989b3de5.webp']);
  assert.deepEqual(heroImages({ ...dest, places: [] }), ['cover']);
});

test('khối tiếp tục ưu tiên chuyến, chọn dở chỉ khi không có chuyến, trống thì ẩn', () => {
  assert.equal(resumeKind(true, 5), 'trip');
  assert.equal(resumeKind(true, 0), 'trip');
  assert.equal(resumeKind(false, 2), 'picked');
  assert.equal(resumeKind(false, 0), null);
});

test('chọn chuyến hôm nay, rồi chuyến sắp tới gần nhất, rồi bản làm mới nhất mà không đổi mảng gốc', () => {
  const old = { id: 'old', startDate: '2026-09-01', endDate: '2026-09-02', createdAt: 1 } as Trip;
  const live = { ...old, id: 'live', startDate: '2026-10-29', endDate: '2026-10-30' };
  const next = { ...old, id: 'next', startDate: '2026-11-01', endDate: '2026-11-02' };
  const later = { ...next, id: 'later', startDate: '2026-12-01' };
  const draft = { ...live, id: 'draft', datesTentative: true, createdAt: 100 };
  const trips = [old, draft, later, next, live];
  assert.equal(homeTrip(trips, '2026-10-29')?.id, 'live');
  assert.equal(homeTrip(trips.slice(0, -1), '2026-10-29')?.id, 'next');
  assert.equal(homeTrip([old, draft], '2026-10-29')?.id, 'draft');
  assert.equal(homeTrip([], '2026-10-29'), null);
  assert.deepEqual(trips.map(t => t.id), ['old', 'draft', 'later', 'next', 'live']);
});
