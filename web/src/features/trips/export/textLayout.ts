import { PNG } from './export.const.ts';
import { EXPORT_COPY as C } from './export.copy.ts';
import type { LayoutPage, MeasureText, TextBlock, TextRole } from './Export.types.ts';

export const LINE_HEIGHT: Readonly<Record<TextRole, number>> = {
  title: PNG.titleLine, heading: PNG.headingLine, body: PNG.bodyLine, small: PNG.smallLine,
};

/** Rút chữ theo điểm mã Unicode và kiểm cả độ rộng dấu ba chấm, không cắt giữa cặp surrogate. */
export function ellipsize(text: string, width: number, measure: (text: string) => number): string {
  if (measure(text) <= width) return text;
  const chars = Array.from(text);
  while (chars.length && measure(`${chars.join('')}…`) > width) chars.pop();
  return measure('…') <= width ? `${chars.join('')}…` : '';
}

/** Xuống dòng theo từ, tách cả từ liền quá dài; giới hạn dòng chỉ khi người gọi yêu cầu. */
export function wrapText(text: string, width: number, measure: (text: string) => number, maxLines = Infinity): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.normalize('NFC').trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= width) { line = candidate; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const char of Array.from(word)) {
      if (line && measure(line + char) > width) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  const last = visible.length - 1;
  visible[last] = ellipsize(lines.slice(last).join(' '), width, measure);
  return visible;
}

/** Chia đoạn theo chiều cao thật; giữ tiêu đề ngày với khối kế và không bỏ dòng khi sang ảnh. */
export function paginateBlocks(blocks: readonly TextBlock[], measure: MeasureText, top: number, bottom: number, nextTop: number): LayoutPage[] {
  const pages: { lines: { text: string; role: TextRole; y: number }[] }[] = [{ lines: [] }];
  let y = top;
  /** Nhắc lại ngày khi tiếp nội dung ở ảnh sau để người nhận không nhầm thứ tự ngày. */
  function nextPage(section: string | undefined): void {
    pages.push({ lines: [] }); y = nextTop;
    if (!section) return;
    const lines = wrapText(`${section} ${C.continued}`, PNG.width - PNG.margin * PNG.edgeCount, text => measure(text, 'heading'));
    for (const text of lines) {
      pages.at(-1)!.lines.push({ text, role: 'heading', y }); y += LINE_HEIGHT.heading;
    }
    y += PNG.gap;
  }
  const wrapped = blocks.map(b => ({ ...b, lines: wrapText(b.text, PNG.width - PNG.margin * PNG.edgeCount, t => measure(t, b.role), b.maxLines) }));
  for (const [index, block] of wrapped.entries()) {
    const height = block.lines.length * LINE_HEIGHT[block.role] + PNG.gap;
    let reserve = 0;
    for (let next = index; wrapped[next]?.keepNext; next++) {
      const following = wrapped[next + 1];
      if (following) reserve += following.lines.length * LINE_HEIGHT[following.role] + PNG.gap;
    }
    if (y + height + reserve > bottom && pages.at(-1)!.lines.length) nextPage(block.section);
    for (const text of block.lines) {
      if (y + LINE_HEIGHT[block.role] > bottom) nextPage(block.section);
      pages.at(-1)!.lines.push({ text, role: block.role, y });
      y += LINE_HEIGHT[block.role];
    }
    y += PNG.gap;
  }
  return pages;
}
