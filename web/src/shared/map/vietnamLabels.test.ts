import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';
import { withVietnamLabels } from './vietnamLabels.ts';
import { VIETNAM_ARCHIPELAGO_LABELS } from './vietnamLabels.const.ts';

test('nhãn hai quần đảo hợp lệ với renderer, độc lập với dữ liệu điểm đến và không đổi style gốc', () => {
  const base: StyleSpecification = { version: 8, sources: {}, layers: [], glyphs: 'https://example.test/{fontstack}/{range}.pbf' };
  const result = withVietnamLabels(base, 'rgb(80,100,90)', 'rgb(255,255,255)');
  assert.deepEqual(validateStyleMin(result).map(error => error.message), []);
  assert.deepEqual(base.sources, {});
  const source = result.sources['wander-vietnam-geography'];
  assert.ok(source?.type === 'geojson' && typeof source.data !== 'string' && source.data.type === 'FeatureCollection');
  assert.deepEqual(source.data.features.map(feature => feature.properties?.['name']), VIETNAM_ARCHIPELAGO_LABELS.map(label => label.name));
  assert.equal(source.data.features.length, 2);
});
