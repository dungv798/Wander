import test from 'node:test';
import assert from 'node:assert/strict';
import type { DestinationDetail } from '../../discover/index.ts';
import { coverPhotos, coverUrl, gradientStyle, parseCover } from './cover.ts';

const dest = { coverUrl: '/catalog/photos/default-1.jpg', places: [{ name: 'Hồ', photos: Array.from({ length: 15 }, (_, n) => ({ url: `/catalog/photos/ho-${n + 1}.jpg`, author: 'Tác giả', license: 'CC BY', sourceUrl: 'https://example.org' })) }] } as unknown as DestinationDetail;

test('lưới tối đa 12 ảnh catalog, mã slug không kèm đuôi; bỏ ảnh trùng và URL ngoài catalog', () => {
  assert.equal(coverPhotos(dest).length, 12);
  assert.equal(coverPhotos(dest)[0]?.ref, 'ho-1');
  const bad = { ...dest, places: [{ name: 'A', photos: [{ url: 'https://example.com/evil.jpg' }, { url: '/catalog/photos/a-1.jpg' }, { url: '/catalog/photos/a-1.jpg' }, { url: '/catalog/photos/../evil.jpg' }] }] } as unknown as DestinationDetail;
  assert.deepEqual(coverPhotos(bad).map(p => p.ref), ['a-1']);
});

test('giải mã bìa cũ/null, sáu gradient; từ chối mã và cấu trúc sai', () => {
  for (const raw of [null, undefined, {}, 'cover-1', { kind: 'gradient', ref: 'cover-7' }, { kind: 'photo', ref: '../a' }, { kind: 'photo', ref: 'a--b' }]) assert.equal(parseCover(raw), null);
  for (let n = 1; n <= 6; n++) assert.deepEqual(parseCover({ kind: 'gradient', ref: `cover-${n}` }), { kind: 'gradient', ref: `cover-${n}` });
  assert.deepEqual(parseCover({ kind: 'photo', ref: 'ho-1' }), { kind: 'photo', ref: 'ho-1' });
});

test('ảnh chọn phải thuộc catalog điểm đến; ảnh ngoài 12 vẫn đọc được; mặc định giữ ảnh cũ', () => {
  assert.equal(coverUrl({ kind: 'photo', ref: 'ho-15' }, dest, 'old'), '/catalog/photos/ho-15.jpg');
  assert.equal(coverUrl({ kind: 'photo', ref: 'khac-1' }, dest, 'old'), 'old');
  assert.equal(coverUrl(null, dest, 'old'), 'old');
  assert.equal(coverUrl({ kind: 'gradient', ref: 'cover-1' }, dest, 'old'), '');
  assert.deepEqual(gradientStyle({ kind: 'gradient', ref: 'cover-1' }), { background: 'var(--cover-1)' });
  assert.equal(gradientStyle({ kind: 'gradient', ref: 'cover-999' }), undefined);
});

test('covers use the stable photo id, so a stored ref keeps working after the file is re-encoded under a hashed name', () => {
  const hashed = { ...dest, places: [{ name: 'Hồ', photos: [{ id: 'ho-1', url: '/catalog/photos/ho-1-w1280-3fa9c1d2ab.webp', thumbUrl: '/catalog/photos/ho-1-w480-0123456789.webp', author: 'A', license: 'CC BY 4.0', sourceUrl: 'https://example.org/p' }] }] } as unknown as DestinationDetail;
  assert.equal(coverPhotos(hashed)[0]?.ref, 'ho-1');
  assert.equal(coverUrl({ kind: 'photo', ref: 'ho-1' }, hashed, 'old'), '/catalog/photos/ho-1-w1280-3fa9c1d2ab.webp');
});
