import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { FLUENT_ICONS, FLUENT_SIZE } from './fluentIcons.const.ts';

test('category, buổi, mùa, nhãn biên tập có tài nguyên đúng nghĩa', () => {
  assert.equal(FLUENT_ICONS.trees, 'national_park');
  assert.equal(FLUENT_ICONS.columns, 'classical_building');
  assert.equal(FLUENT_ICONS['tools-kitchen-2'], 'fork_and_knife');
  assert.equal(FLUENT_ICONS['calendar-event'], 'calendar');
  assert.equal(FLUENT_ICONS.sunrise, 'sunrise');
  assert.equal(FLUENT_ICONS['moon-stars'], 'crescent_moon');
  assert.equal(FLUENT_ICONS['rosette-discount-check'], 'glowing_star');
  for (const file of Object.values(FLUENT_ICONS)) {
    assert.ok(existsSync(new URL(`../../../../public/look/icons/${file}_3d.png`, import.meta.url)), file);
  }
  assert.ok(Object.values(FLUENT_SIZE).every((size) => size >= 24 && size <= 48));
});

test('điều khiển, chợ, khoảng cách, thuê xe và đánh giá tiện đường không mượn sai emoji', () => {
  for (const name of ['building-store', 'route', 'key', 'clock', 'info-circle', 'list-check', 'x', 'chevron-left', 'plus', 'share-2'] as const) {
    assert.equal(FLUENT_ICONS[name], undefined, name);
  }
  assert.equal(FLUENT_ICONS.motorbike, 'motorcycle');
});
