import test from 'node:test';
import assert from 'node:assert/strict';
import { topicDestinations } from './topicDestinations.ts';
import type { CatalogRepository } from './CatalogRepository.ts';
import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';

const summaries = [{ id: 'food', categories: ['am'] }, { id: 'mountain', categories: ['leo'] }, { id: 'market', categories: ['cho'] }] as unknown as DestinationSummary[];

test('lọc toàn quốc không tải chi tiết; văn hóa vẫn có chợ, thiên nhiên vẫn có trekking', async () => {
  const catalog = { destination: () => { throw new Error('Không được tải chi tiết'); } } as unknown as CatalogRepository;
  assert.deepEqual((await topicDestinations(summaries, 'am', catalog)).map(d => d.id), ['food']);
  assert.deepEqual((await topicDestinations(summaries, 'van', catalog)).map(d => d.id), ['market']);
  assert.deepEqual((await topicDestinations(summaries, 'canh', catalog)).map(d => d.id), ['mountain']);
  assert.deepEqual(await topicDestinations(summaries, 'all', catalog), summaries);
});

test('API cũ chỉ tải bù nơi thiếu metadata; hủy không trả kết quả lọc cũ', async () => {
  const calls: string[] = [];
  const catalog = { destination: async (id: string) => { calls.push(id); return { places: [{ category: 'am' }] } as unknown as DestinationDetail; } } as CatalogRepository;
  const list = [...summaries, { id: 'legacy' } as DestinationSummary];
  assert.deepEqual((await topicDestinations(list, 'am', catalog)).map(d => d.id), ['food', 'legacy']);
  assert.deepEqual(calls, ['legacy']);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(topicDestinations(summaries, 'am', catalog, abort.signal), { name: 'AbortError' });
});
