import test from 'node:test';
import assert from 'node:assert/strict';
import { deckReducer, EMPTY_DECK, pickedCount } from './swipeDeck.ts';

test('quẹt phải chọn, quẹt trái bỏ qua: số nơi đã chọn chỉ tăng khi quẹt phải', () => {
  let s = deckReducer(EMPTY_DECK, { type: 'commit', kind: 'pick', total: 3 });
  s = deckReducer(s, { type: 'commit', kind: 'skip', total: 3 });
  assert.equal(s.cur, 2);
  assert.equal(pickedCount(s), 1);
  assert.deepEqual(s.flights, { 0: 'pick', 1: 'skip' });
});

test('hết thẻ thì quẹt thêm không làm gì', () => {
  const full = deckReducer(deckReducer(EMPTY_DECK, { type: 'commit', kind: 'pick', total: 1 }), { type: 'commit', kind: 'pick', total: 1 });
  assert.equal(full.cur, 1);
  assert.equal(pickedCount(full), 1);
});

test('reset đưa bộ bài về trạng thái đầu', () => {
  const s = deckReducer(EMPTY_DECK, { type: 'commit', kind: 'pick', total: 2 });
  assert.deepEqual(deckReducer(s, { type: 'reset' }), EMPTY_DECK);
});
