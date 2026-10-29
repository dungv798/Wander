import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrip, freeItem, S0 } from '../model/tripFixtures.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { costLabel, dateLabel, exportBlocks, pngFilename, timeLabel } from './exportModel.ts';
import { ellipsize, LINE_HEIGHT, paginateBlocks, wrapText } from './textLayout.ts';
import type { TextBlock } from './Export.types.ts';
import { PNG } from './export.const.ts';

const destination = { id: 'ha-giang', name: 'Hà Giang', places: [] } as unknown as DestinationDetail;
const trip = createTrip(S0, { name: 'Chuyến Hà Giang', destinationId: destination.id, startDate: '2026-11-10', endDate: '2026-11-11' }, [], () => 'trip', 1).trip;
const item = freeItem('food', 'Bữa trưa', () => 'item');

test('D17/D18 giữ giá chưa biết, giá 0, đã bao gồm và giá nghìn đồng', () => {
  assert.equal(costLabel(item), 'Chưa biết giá');
  assert.match(costLabel({ ...item, costK: 0 }), /^0\s₫$/u);
  assert.match(costLabel({ ...item, costK: 1500 }), /^1\.500\.000\s₫$/u);
  assert.equal(costLabel({ ...item, included: true, costK: 999, referenceK: 200 }), 'Đã bao gồm');
  assert.equal(costLabel({ ...item, type: 'rest' }), '');
});

test('giờ vắng có nhãn, giây API không xuất và tên tệp bỏ ký tự cấm', () => {
  assert.equal(timeLabel(null), 'Chưa đặt giờ');
  assert.equal(timeLabel('09:30:00'), '09:30');
  for (const name of ['<>:"/\\|?*\n', 'CON', 'NUL.', 'Hà Giang '.repeat(100)]) {
    const filename = pngFilename(name, 0, 2);
    assert.doesNotMatch(filename, /[<>:"/\\|?*\p{Cc}]/u);
    assert.match(filename, /^chuyen-di-.+-1\.png$/u);
    assert.ok(Array.from(filename).length < 120);
  }
});

test('ngày trống, thiếu ngày và ngày dự kiến không bịa lịch thật', () => {
  const text = exportBlocks({ trip, destination }).map(b => b.text).join('\n');
  assert.match(text, /Ngày 1/); assert.match(text, /Ngày 2/); assert.match(text, /Chưa có địa điểm/);
  assert.equal(dateLabel({ ...trip, startDate: '', endDate: '' }), 'Chưa có ngày đi');
  const tentative = exportBlocks({ trip: { ...trip, datesTentative: true }, destination }).map(b => b.text).join('\n');
  assert.match(tentative, /Ngày dự kiến/); assert.doesNotMatch(tentative, /10\/11|11\/11/);
});

test('mục chưa xếp ngày không xuất, chỉ ghi chú; tổng không cộng đã bao gồm, chưa biết hay nghỉ', () => {
  const items = [
    { ...item, title: 'Chưa xếp', day: null, costK: 777 },
    { ...item, id: 'paid', day: trip.startDate, costK: 50, position: 0 },
    { ...item, id: 'inc', day: trip.startDate, included: true, costK: 999, position: 1 },
    { ...item, id: 'unk', day: trip.startDate, costK: null, position: 2 },
  ];
  const blocks = exportBlocks({ trip: { ...trip, items }, destination });
  const text = blocks.map(b => b.text).join('\n');
  assert.doesNotMatch(text, /1\. Chưa xếp/); assert.match(text, /1 mục chưa có ngày không nằm trong ảnh này/);
  assert.match(text, /giá đã biết\): 50\.000\s₫/); assert.match(text, /1 mục chưa biết giá/);
  assert.doesNotMatch(text, /999\.000|777\.000/);
});

test('đo chữ Việt và từ liền rất dài: mọi dòng vừa, dấu … cũng được đo', () => {
  const measure = (text: string) => Array.from(text).reduce((n, c) => n + (c === 'W' ? 3 : 1), 0);
  const text = `Đường đến những miền ký ức ${'W'.repeat(50)} tiếng Việt có dấu`;
  const lines = wrapText(text, 20, measure);
  assert.ok(lines.every(line => measure(line) <= 20));
  const clipped = wrapText(text, 20, measure, 2);
  assert.equal(clipped.length, 2); assert.ok(clipped[1]!.endsWith('…'));
  assert.ok(clipped.every(line => measure(line) <= 20));
  assert.equal(ellipsize('WWW', 4, measure), 'W…');
});

test('nhiều ngày dài phân đoạn không mất dòng, không tràn đáy và tiêu đề không đứng lẻ', () => {
  const blocks: TextBlock[] = Array.from({ length: 100 }, (_, i) => ({ text: `Địa điểm số ${i}`, role: 'body' }));
  const pages = paginateBlocks(blocks, text => text.length, 500, 1700, PNG.margin);
  assert.ok(pages.length > 1);
  assert.deepEqual(pages.flatMap(p => p.lines.map(l => l.text)), blocks.map(b => b.text));
  assert.ok(pages.every(p => p.lines.every(l => l.y + LINE_HEIGHT[l.role] <= 1700)));
  const kept = paginateBlocks([{ text: 'Mở đầu', role: 'title' }, { text: 'Ngày 2', role: 'heading', keepNext: true }, { text: '1. Điểm mới', role: 'body' }], text => text.length, 1400, 1620, PNG.margin);
  assert.deepEqual(kept[1]?.lines.map(l => l.text), ['Ngày 2', '1. Điểm mới']);
});

test('ngày dài nhắc lại ngày ở ảnh sau và giữ tên với giờ/chi phí', () => {
  const blocks: TextBlock[] = [{ text: 'Ngày 1', role: 'heading', keepNext: true }];
  for (let i = 0; i < 30; i++) blocks.push(
    { text: `Điểm ${i}`, role: 'body', keepNext: true, section: 'Ngày 1' },
    { text: 'Chưa đặt giờ · Chưa biết giá', role: 'small', section: 'Ngày 1' },
  );
  const pages = paginateBlocks(blocks, text => text.length, 452, 1672, 72);
  assert.ok(pages.slice(1).every(page => page.lines[0]?.text === 'Ngày 1 (tiếp)'));
  for (const page of pages) {
    assert.ok(!page.lines.at(-1)?.text.startsWith('Điểm'));
    assert.ok(page.lines.every(line => line.y + LINE_HEIGHT[line.role] <= 1672));
  }
});
