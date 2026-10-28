import test from 'node:test';
import assert from 'node:assert/strict';
import { groupChecklist } from './checklistGroups.ts';

const item = (id: string, group: string, position: number) => ({ id, group, title: id, position, done: false, doneBy: [] as string[] });

test('gom theo nhóm giữ thứ tự xuất hiện đầu tiên; trong nhóm theo vị trí; hạng mục không nhóm xếp cuối', () => {
  const groups = groupChecklist([item('a', 'Đồ dùng', 2), item('b', '', 0), item('c', 'Giấy tờ', 1), item('d', 'Đồ dùng', 0)]);
  assert.deepEqual(groups.map((g) => g.group), ['Đồ dùng', 'Giấy tờ', '']);
  assert.deepEqual(groups[0]?.items.map((i) => i.id), ['d', 'a']);
});

test('danh sách rỗng cho ra không nhóm nào', () => {
  assert.deepEqual(groupChecklist([]), []);
});
