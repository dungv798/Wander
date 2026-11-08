import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Map as MlMap } from 'maplibre-gl';
import { loadThumbnailImage } from './loadThumbnailImage.ts';

test('ảnh catalog cùng origin vẫn qua bộ tải MapLibre và giữ nguyên query', async () => {
  const bitmap = { width: 96, height: 96 } as ImageBitmap;
  const paths: string[] = [];
  const map = { loadImage: async (url: string) => { paths.push(url); return { data: bitmap }; } } as unknown as MlMap;
  assert.equal(await loadThumbnailImage(map, '/catalog/photos/p.jpg?w=96'), bitmap);
  assert.deepEqual(paths, ['/catalog/photos/p.jpg?w=96']);
});

test('ảnh HTTPS dùng phần tử ảnh CORS ẩn danh, không gọi fetch của MapLibre; lỗi ảnh được báo về', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  class TestImage {
    crossOrigin = '';
    decoding = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(url: string) { assert.equal(this.crossOrigin, 'anonymous'); queueMicrotask(() => url.endsWith('/bad') ? this.onerror?.() : this.onload?.()); }
  }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: TestImage });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'Image', previous); else Reflect.deleteProperty(globalThis, 'Image'); });
  const map = { loadImage: () => { throw new Error('Không được dùng fetch ảnh ngoài'); } } as unknown as MlMap;
  const image = await loadThumbnailImage(map, 'https://images.unsplash.com/example');
  assert.equal((image as HTMLImageElement).crossOrigin, 'anonymous');
  await assert.rejects(loadThumbnailImage(map, 'https://images.unsplash.com/bad'));
});
