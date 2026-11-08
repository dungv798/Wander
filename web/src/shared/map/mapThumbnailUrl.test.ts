import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapThumbnailUrl } from './mapThumbnailUrl.ts';

test('ghim ảnh CDN dùng 96 px, giữ mã ảnh và tham số ghi nhận nguồn thay vì tải ảnh 1200 px', () => {
  const source = 'https://images.unsplash.com/photo-example?ixid=attribution-id&w=1200&q=80&fit=max';
  const result = new URL(mapThumbnailUrl(source));
  assert.equal(result.pathname, '/photo-example');
  assert.equal(result.searchParams.get('ixid'), 'attribution-id');
  assert.equal(result.searchParams.get('w'), '96');
  assert.equal(result.searchParams.get('h'), '96');
  assert.equal(result.searchParams.get('fit'), 'crop');
  assert.equal(source.includes('w=1200'), true);
});

test('ảnh local và máy chủ không thuộc CDN giữ nguyên URL và query', () => {
  for (const source of ['/catalog/photos/p.jpg?v=2', 'https://example.org/p.jpg?w=1200', 'https://images.unsplash.com.example.org/p.jpg']) assert.equal(mapThumbnailUrl(source), source);
});

test('ảnh catalog đã có biến thể dùng thumbnail thật; ảnh chưa dựng không đoán đường dẫn', () => {
  assert.match(mapThumbnailUrl('/catalog/photos/nha-tho-con-ga-2.jpg'), /^\/assets\/map-photos\/nha-tho-con-ga-2-96-v1-[a-f0-9]{12}\.jpg$/);
  assert.equal(mapThumbnailUrl('/catalog/photos/unknown.jpg'), '/catalog/photos/unknown.jpg');
});
