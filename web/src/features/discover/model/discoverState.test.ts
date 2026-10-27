import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DISCOVER_STATE as S0, decide, pickedOf, remainingIds, restartSkipped, sanitizeDiscoverState, setPhotoIndex, toggleGuide, undoLast, unpick } from './discoverState.ts';

const PLACES = [
  { id: 'a', category: 'canh' as const },
  { id: 'b', category: 'van' as const },
  { id: 'c', category: 'canh' as const },
];

test('quẹt phải/trái ghi quyết định và lịch sử, đưa ảnh về đầu', () => {
  const s = decide(setPhotoIndex(S0, 'a', 2), 'a', 'like');
  assert.equal(s.decisions['a'], 'like');
  assert.deepEqual(s.history, ['a']);
  assert.equal(s.photo['a'], 0);
});

test('hoàn tác chỉ gỡ thẻ cuối, không làm gì khi lịch sử trống', () => {
  const s = decide(decide(S0, 'a', 'like'), 'b', 'skip');
  const back = undoLast(s);
  assert.equal(back.decisions['b'], undefined);
  assert.equal(back.decisions['a'], 'like');
  assert.equal(undoLast(S0), S0);
});

test('còn lại = chưa quyết, đúng loại', () => {
  const s = decide(S0, 'a', 'like');
  assert.deepEqual(remainingIds(s, PLACES).map((p) => p.id), ['b', 'c']);
  assert.deepEqual(remainingIds({ ...s, cat: 'canh' }, PLACES).map((p) => p.id), ['c']);
});

test('xem lại thẻ đã bỏ qua nhưng giữ nơi đã chọn', () => {
  const s = restartSkipped(decide(decide(S0, 'a', 'like'), 'b', 'skip'));
  assert.deepEqual(pickedOf(s, PLACES).map((p) => p.id), ['a']);
  assert.equal(s.decisions['b'], undefined);
  assert.deepEqual(s.history, []);
});

test('bỏ chọn gỡ khỏi lịch sử; khối cẩm nang bấm lần hai thì đóng', () => {
  assert.deepEqual(unpick(decide(S0, 'a', 'like'), 'a').history, []);
  assert.equal(toggleGuide(S0, 'mua').guide, '');
  assert.equal(toggleGuide(toggleGuide(S0, 'mua'), 'an').guide, 'an');
});

test('làm sạch dữ liệu lưu hỏng: null, mảng, sai kiểu từng trường', () => {
  assert.equal(sanitizeDiscoverState(null), null);
  assert.equal(sanitizeDiscoverState([]), null);
  const s = sanitizeDiscoverState({ decisions: null, history: 'x', photo: { a: -1, b: 2 }, cat: 'khong-co', guide: 5, pack: { x: true, y: 1 }, onboarded: 'có' });
  assert.ok(s);
  assert.deepEqual(s.decisions, {});
  assert.deepEqual(s.history, []);
  assert.deepEqual(s.photo, { b: 2 });
  assert.equal(s.cat, 'all');
  assert.equal(s.guide, 'mua');
  assert.deepEqual(s.pack, { x: true });
  assert.equal(s.onboarded, false);
});

test('hoàn tác đưa bộ lọc về "Tất cả" để thẻ trả về luôn hiện', () => {
  const s = undoLast({ ...decide(S0, 'a', 'like'), cat: 'van' });
  assert.equal(s.cat, 'all');
});
