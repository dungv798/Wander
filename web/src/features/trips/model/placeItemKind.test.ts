import assert from 'node:assert/strict';
import test from 'node:test';
import { placeItemKind } from './placeItemKind.ts';
import { placeInput } from '../hooks/tripsActions.ts';

test('quán cà phê thành Nghỉ, quán ăn thành Ăn uống và khách sạn thành Lưu trú; không giả booking', () => {
  const cafe = { id: 'cafe', category: 'am', name: 'Cà phê', venue: { kind: 'cafe' as const } };
  assert.equal(placeItemKind(cafe), 'rest');
  assert.equal(placeItemKind({ id: 'bar', category: 'am', venue: { kind: 'bar' } }), 'rest');
  assert.equal(placeInput(cafe).booking, null);
  assert.equal(placeInput(cafe).costK, null);
  assert.equal(placeItemKind({ id: 'food', category: 'am', venue: { kind: 'restaurant' } }), 'food');
  assert.equal(placeInput({ id: 'hotel', category: 'luu', venue: { kind: 'lodging' } }).booking, 'pending');
  assert.equal(placeItemKind({ id: 'legacy', category: 'am' }), 'food');
});
