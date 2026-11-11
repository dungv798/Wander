import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DISCOVER_STATE as S0, decide, markSaved, pendingPickCount, pickedOf, remainingIds, restartSkipped, sanitizeDiscoverState, savedPicksOf, setPhotoIndex, toggleGuide, undoLast, unpick } from './discoverState.ts';

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

test('đánh dấu đã vào chuyến: chỉ nơi đã thích, nơi đó thôi tính vào "đã chọn" nhưng vẫn là quyết định thích (B-06)', () => {
  const liked = decide(decide(decide(S0, 'a', 'like'), 'b', 'like'), 'c', 'skip');
  const s = markSaved(liked, ['a', 'c', 'khong-co']);
  assert.deepEqual(pickedOf(s, PLACES).map((p) => p.id), ['b']);
  assert.deepEqual(savedPicksOf(s, PLACES).map((p) => p.id), ['a']);
  assert.equal(s.decisions['a'], 'like');
  assert.equal(s.saved['c'], undefined);
  assert.equal(s.saved['khong-co'], undefined);
});

test('số nơi chờ lưu chỉ đếm nơi đã thích và chưa vào chuyến', () => {
  const s = markSaved(decide(decide(decide(S0, 'a', 'like'), 'b', 'like'), 'c', 'skip'), ['a']);
  assert.equal(pendingPickCount(s), 1);
  assert.equal(pendingPickCount(S0), 0);
});

test('bỏ chọn, quẹt lại hoặc hoàn tác một nơi đã vào chuyến thì gỡ dấu "đã vào chuyến"', () => {
  const saved = markSaved(decide(S0, 'a', 'like'), ['a']);
  assert.equal(unpick(saved, 'a').saved['a'], undefined);
  assert.equal(decide(saved, 'a', 'skip').saved['a'], undefined);
  assert.equal(undoLast(saved).saved['a'], undefined);
});

test('làm sạch trường saved: chỉ giữ cặp giá trị true; thiếu trường thì rỗng', () => {
  const s = sanitizeDiscoverState({ saved: { a: true, b: false, c: 'x' } });
  assert.ok(s);
  assert.deepEqual(s.saved, { a: true });
  assert.deepEqual(sanitizeDiscoverState({})?.saved, {});
});

test('thẻ quẹt: nơi có ảnh thật đứng trước nơi chưa có ảnh, giữ thứ tự biên tập trong từng nhóm', () => {
  const places = [
    { id: 'a', category: 'canh' as const, photos: [] },
    { id: 'b', category: 'canh' as const, photos: [{}] },
    { id: 'c', category: 'canh' as const, photos: [] },
    { id: 'd', category: 'canh' as const, photos: [{}] },
  ];
  const state = { ...S0, cat: 'all' as const };
  assert.deepEqual(remainingIds(state, places).map((p) => p.id), ['b', 'd', 'a', 'c']);
});
