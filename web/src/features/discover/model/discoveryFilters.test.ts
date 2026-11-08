import assert from 'node:assert/strict';
import { test } from 'node:test';
import { discoveryFilters, matchesDiscoveryFilter, summaryTopicDestinations } from './discoveryFilters.ts';
import type { DestinationSummary } from './Catalog.types.ts';
import { INITIAL_DISCOVER_STATE, remainingIds } from './discoverState.ts';

test('chủ đề văn hóa chứa cả chợ; thiên nhiên có trekking; món ăn không lấy thẻ khác loại', () => {
  assert.equal(matchesDiscoveryFilter({ category: 'cho' }, 'van'), true);
  assert.equal(matchesDiscoveryFilter({ category: 'leo' }, 'canh'), true);
  assert.equal(matchesDiscoveryFilter({ category: 'van' }, 'am'), false);
  assert.deepEqual(discoveryFilters([{ category: 'cho' }, { category: 'am' }, { category: 'leo' }]), ['all', 'am', 'van', 'canh', 'leo']);
});

test('quẹt và danh sách dùng cùng nhóm văn hóa, vẫn bỏ thẻ đã quyết định', () => {
  const places = [{ id: 'market', category: 'cho' as const }, { id: 'village', category: 'van' as const }, { id: 'food', category: 'am' as const }];
  const left = remainingIds({ ...INITIAL_DISCOVER_STATE, cat: 'van', decisions: { village: 'skip' } }, places);
  assert.deepEqual(left.map(place => place.id), ['market']);
});

test('metadata lọc đúng nhóm/thứ tự; tập không đổi giữ tham chiếu để không bay lại camera', () => {
  const list = [{ id: 'a', categories: ['am', 'cho'] }, { id: 'b', categories: ['am', 'leo'] }] as unknown as DestinationSummary[];
  assert.equal(summaryTopicDestinations(list, 'all'), list);
  assert.equal(summaryTopicDestinations(list, 'am'), list);
  assert.deepEqual(summaryTopicDestinations(list, 'van').map(d => d.id), ['a']);
  assert.deepEqual(summaryTopicDestinations(list, 'canh').map(d => d.id), ['b']);
  assert.deepEqual(summaryTopicDestinations([{ id: 'legacy' } as DestinationSummary], 'am'), []);
});
