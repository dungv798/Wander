import test from 'node:test';
import assert from 'node:assert/strict';
import type { PlaceView } from '../../discover/index.ts';
import { buildTrip, dayOfPlace } from './sampleTrip.ts';
import { initialShare, shareReducer } from './shareState.ts';
import type { ShareAction } from './shareState.ts';

/** Địa điểm giả tối thiểu. */
function place(id: string): PlaceView {
  return { id, name: id, lat: 11.9, lon: 108.4, photos: [] } as unknown as PlaceView;
}
const IDS = ['nha-tho-con-ga', 'quang-truong-lam-vien', 'ho-xuan-huong', 'cho-da-lat', 'thien-vien-truc-lam', 'thac-datanla', 'ho-tuyen-lam'];
const base = initialShare(buildTrip((id) => (IDS.includes(id) ? place(id) : null)), 'me');
const run = (actions: readonly ShareAction[]) => actions.reduce(shareReducer, base);
const GA = place('ga-da-lat');

test('thứ tự đúng: mời → sao chép → bạn bè vào → đề xuất → chấp nhận đưa Ga Đà Lạt vào lịch', () => {
  const s = run([{ type: 'share' }, { type: 'copy' }, { type: 'join', member: 'mai' }, { type: 'join', member: 'bao' }, { type: 'propose' }, { type: 'accept', place: GA }]);
  assert.deepEqual(s.members, ['me', 'mai', 'bao']);
  assert.equal(s.decided, 'accepted');
  assert.equal(dayOfPlace(s.days, 'ga-da-lat'), 1);
});

test('sao chép khi chưa mở bảng mời bị bỏ qua; chấp nhận khi chưa có đề xuất bị bỏ qua', () => {
  assert.equal(run([{ type: 'copy' }]).copied, false);
  assert.equal(dayOfPlace(run([{ type: 'accept', place: GA }]).days, 'ga-da-lat'), -1);
});

test('chấp nhận rồi từ chối (hoặc ngược lại) không đổi quyết định đầu; không trùng địa điểm', () => {
  const s = run([{ type: 'share' }, { type: 'propose' }, { type: 'accept', place: GA }, { type: 'reject' }, { type: 'accept', place: GA }]);
  assert.equal(s.decided, 'accepted');
  assert.equal(s.days[1]!.items.filter((i) => i.kind === 'stop' && i.place.id === 'ga-da-lat').length, 1);
});

test('từ chối giữ nguyên lịch', () => {
  const s = run([{ type: 'share' }, { type: 'propose' }, { type: 'reject' }]);
  assert.equal(s.decided, 'rejected');
  assert.equal(dayOfPlace(s.days, 'ga-da-lat'), -1);
});

test('mỗi thành viên chỉ vào một lần; reset trả về lịch gốc', () => {
  const s = run([{ type: 'join', member: 'mai' }, { type: 'join', member: 'mai' }]);
  assert.deepEqual(s.members, ['me', 'mai']);
  assert.deepEqual(shareReducer(s, { type: 'reset', state: base }), base);
});
