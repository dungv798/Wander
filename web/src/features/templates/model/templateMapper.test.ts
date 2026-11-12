import test from 'node:test';
import assert from 'node:assert/strict';
import type { DestinationDetail } from '../../discover/index.ts';
import { toTemplateViews } from './templateMapper.ts';

/** A fake destination with only place ids (the mapper looks up by id only). */
const DEST = { places: ['a', 'b', 'c'].map((id) => ({ id, name: id.toUpperCase() })) } as unknown as DestinationDetail;

const RAW = {
  templates: [
    { id: 't1', title: 'Lịch một', summary: 'Tóm tắt', status: 'draft', days: [{ places: ['a', 'b'] }, { places: ['c'], note: 'Ghi chú' }] },
  ],
};

test('ghép lịch mẫu với kho: giữ thứ tự ngày/địa điểm, đếm địa điểm, ghi chú', () => {
  const [t] = toTemplateViews(RAW, DEST);
  assert.equal(t?.days.length, 2);
  assert.deepEqual(t?.days[0]?.places.map((p) => p.id), ['a', 'b']);
  assert.equal(t?.days[1]?.note, 'Ghi chú');
  assert.equal(t?.placeCount, 3);
  assert.equal(t?.status, 'draft');
});

test('địa điểm không có trong kho bị bỏ; địa điểm lặp lại ở ngày sau chỉ giữ lần đầu; lịch không còn địa điểm nào bị bỏ', () => {
  const out = toTemplateViews({ templates: [
    { id: 'x', title: 'X', days: [{ places: ['a', 'khong-co'] }, { places: ['a', 'b'] }] },
    { id: 'rong', title: 'Rỗng', days: [{ places: ['khong-co'] }] },
  ] }, DEST);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0]?.days.map((d) => d.places.map((p) => p.id)), [['a'], ['b']]);
});

test('trạng thái lạ hoặc thiếu coi là bản nháp (an toàn); chỉ "approved" mới là đã duyệt', () => {
  const mk = (status: unknown) => toTemplateViews({ templates: [{ id: 't', title: 'T', status, days: [{ places: ['a'] }] }] }, DEST)[0]?.status;
  assert.equal(mk(undefined), 'draft');
  assert.equal(mk('published'), 'draft');
  assert.equal(mk('approved'), 'approved');
});

test('dữ liệu hỏng không làm sập: không phải đối tượng, thiếu mảng, mã trùng, thiếu tên', () => {
  assert.deepEqual(toTemplateViews(null, DEST), []);
  assert.deepEqual(toTemplateViews({}, DEST), []);
  assert.deepEqual(toTemplateViews({ templates: 'x' }, DEST), []);
  const dup = toTemplateViews({ templates: [
    { id: 't', title: 'Một', days: [{ places: ['a'] }] }, { id: 't', title: 'Hai', days: [{ places: ['b'] }] }, { id: 'u', title: '  ', days: [{ places: ['c'] }] }, 5, null,
  ] }, DEST);
  assert.deepEqual(dup.map((t) => t.title), ['Một']);
});

test('ngày không phải đối tượng và quá nhiều ngày được xử lý an toàn', () => {
  const days = Array.from({ length: 40 }, (_, i) => (i === 0 ? { places: ['a'] } : 7));
  const [t] = toTemplateViews({ templates: [{ id: 't', title: 'T', days }] }, DEST);
  assert.equal(t?.days.length, 30);
  assert.deepEqual(t?.days[1]?.places, []);
});
