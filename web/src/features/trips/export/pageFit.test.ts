import test from 'node:test';
import assert from 'node:assert/strict';
import { fitPages } from './pageFit.ts';
import { PNG } from './export.const.ts';
import type { TextBlock } from './Export.types.ts';

const measure = (text: string): number => text.length;
const FOOTER = 200;
const body = (n: number): TextBlock[] => Array.from({ length: n }, (_, i) => ({ text: `Mục ${i}`, role: 'body' }));

test('ít nội dung: một ảnh, cao đúng nội dung nhưng không dưới mức tối thiểu', () => {
  const pages = fitPages(body(5), measure, { top: 400, nextTop: PNG.margin, footer: FOOTER });
  assert.equal(pages.length, 1);
  assert.ok(pages[0]!.height >= PNG.minHeight && pages[0]!.height < PNG.maxHeight);
});

test('ảnh cuối không còn gần như trống: các ảnh được cân và cao tương đương', () => {
  // 1 ảnh đầy + vài dòng thừa sẽ tạo ảnh cuối rất ngắn nếu không cân
  const per = Math.floor((PNG.maxHeight - FOOTER - PNG.gap - PNG.margin) / (PNG.bodyLine + PNG.gap));
  const pages = fitPages(body(per + 3), measure, { top: PNG.margin, nextTop: PNG.margin, footer: FOOTER });
  assert.equal(pages.length, 2);
  const [a, b] = pages;
  assert.ok(Math.abs(a!.lines.length - b!.lines.length) <= 3, `lệch ${a!.lines.length} vs ${b!.lines.length}`);
  assert.equal(pages.flatMap((p) => p.lines.map((l) => l.text)).join('|'), body(per + 3).map((b2) => b2.text).join('|'));
});

test('không ảnh nào vượt chiều cao tối đa', () => {
  const pages = fitPages(body(200), measure, { top: PNG.margin, nextTop: PNG.margin, footer: FOOTER });
  assert.ok(pages.every((p) => p.height <= PNG.maxHeight));
  assert.ok(pages.length > 2);
});
