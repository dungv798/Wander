import test from 'node:test';
import assert from 'node:assert/strict';
import { firstPhotoThumbUrl, firstPhotoUrl, thumbOrUrl } from './destinationQueries.ts';
import type { PhotoView, PlaceView } from './Catalog.types.ts';

const base = { author: 'A', license: 'CC BY 4.0', sourceUrl: 'https://example.org/p' };
const twoSizes: PhotoView = { ...base, id: 'a', url: '/catalog/photos/a-w1280-aaaaaaaaaa.webp', thumbUrl: '/catalog/photos/a-w480-bbbbbbbbbb.webp' };
const oneSize: PhotoView = { ...base, id: 'b', url: '/catalog/photos/b-w800-cccccccccc.webp', thumbUrl: null };
const external: PhotoView = { ...base, id: null, url: 'https://images.unsplash.com/photo-1?w=800' };

test('list and card slots use the 480 px variant when there is one, otherwise the main image', () => {
  assert.equal(thumbOrUrl(twoSizes), twoSizes.thumbUrl);
  assert.equal(thumbOrUrl(oneSize), oneSize.url);
  assert.equal(thumbOrUrl(external), external.url);
  assert.equal(thumbOrUrl(undefined), '');
  assert.equal(thumbOrUrl(null), '');
});

test('first-photo helpers: thumbnail for lists, full size for detail views, empty when there is no photo', () => {
  const place = { photos: [twoSizes, oneSize] } as unknown as PlaceView;
  assert.equal(firstPhotoThumbUrl(place), twoSizes.thumbUrl);
  assert.equal(firstPhotoUrl(place), twoSizes.url);
  assert.equal(firstPhotoThumbUrl({ photos: [] } as unknown as PlaceView), '');
  assert.equal(firstPhotoThumbUrl(null), '');
});
