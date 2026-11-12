import test from 'node:test';
import assert from 'node:assert/strict';
import type { PlaceView } from '../../discover/index.ts';
import { applyProposal, buildTrip, dayOfPlace, dayPlaces } from './sampleTrip.ts';

/** A minimal fake place for the tests (only the fields the sample itinerary uses). */
function place(id: string, withCoords = true): PlaceView {
  return { id, name: id, lat: withCoords ? 11.9 : null, lon: withCoords ? 108.4 : null, photos: [] } as unknown as PlaceView;
}

const IDS = ['nha-tho-con-ga', 'quang-truong-lam-vien', 'ho-xuan-huong', 'cho-da-lat', 'thien-vien-truc-lam', 'thac-datanla', 'ho-tuyen-lam', 'ga-da-lat'];
const dest = (ids: readonly string[], noCoords: readonly string[] = []): ((id: string) => PlaceView | null) => {
  const map = new Map(ids.map((id) => [id, place(id, !noCoords.includes(id))]));
  return (id) => map.get(id) ?? null;
};

test('lịch mẫu có hai ngày, đúng thứ tự ghé thăm và số khớp thứ tự', () => {
  const days = buildTrip(dest(IDS));
  assert.deepEqual(dayPlaces(days[0]!).map((p) => p.id), ['nha-tho-con-ga', 'quang-truong-lam-vien', 'ho-xuan-huong', 'cho-da-lat']);
  assert.deepEqual(dayPlaces(days[1]!).map((p) => p.id), ['thien-vien-truc-lam', 'thac-datanla', 'ho-tuyen-lam']);
  const nums = days[1]!.items.flatMap((i) => (i.kind === 'stop' ? [i.num] : []));
  assert.deepEqual(nums, [1, 2, 3]);
});

test('Ngày 2 có dòng nghỉ trưa không có số và đứng giữa thiền viện và thác', () => {
  const items = buildTrip(dest(IDS))[1]!.items;
  assert.equal(items[1]!.kind, 'break');
});

test('địa điểm thiếu trong kho hoặc thiếu tọa độ bị bỏ, không thay bằng điểm khác', () => {
  const days = buildTrip(dest(IDS.filter((id) => id !== 'ho-xuan-huong'), ['cho-da-lat']));
  assert.deepEqual(dayPlaces(days[0]!).map((p) => p.id), ['nha-tho-con-ga', 'quang-truong-lam-vien']);
});

test('chấp nhận đề xuất đặt Ga Đà Lạt lên đầu Ngày 2 và đánh lại số', () => {
  const base = buildTrip(dest(IDS));
  const after = applyProposal(base, place('ga-da-lat'));
  const first = after[1]!.items[0]!;
  assert.equal(first.kind === 'stop' && first.place.id, 'ga-da-lat');
  assert.equal(first.kind === 'stop' && first.num, 1);
  assert.equal(first.kind === 'stop' && first.proposedBy, 'Mai');
  assert.deepEqual(after[1]!.items.flatMap((i) => (i.kind === 'stop' ? [i.num] : [])), [1, 2, 3, 4]);
  assert.equal(after[0]!.items.length, base[0]!.items.length, 'Ngày 1 không đổi');
});

test('chấp nhận hai lần không tạo bản sao; lịch gốc không bị sửa tại chỗ', () => {
  const base = buildTrip(dest(IDS));
  const once = applyProposal(base, place('ga-da-lat'));
  const twice = applyProposal(once, place('ga-da-lat'));
  assert.equal(twice[1]!.items.filter((i) => i.kind === 'stop' && i.place.id === 'ga-da-lat').length, 1);
  assert.equal(dayOfPlace(base, 'ga-da-lat'), -1, 'lịch gốc vẫn chưa có Ga Đà Lạt');
});
