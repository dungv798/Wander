import { PNG } from './export.const.ts';
import { EXPORT_COPY as C } from './export.copy.ts';
import type { LayoutPage, MeasureText, TextBlock, TextRole } from './Export.types.ts';

export const LINE_HEIGHT: Readonly<Record<TextRole, number>> = {
  title: PNG.titleLine, heading: PNG.headingLine, body: PNG.bodyLine, small: PNG.smallLine,
};

/** Shortens text by Unicode code point and also checks the width of the ellipsis, not cutting in the middle of a surrogate pair. */
export function ellipsize(text: string, width: number, measure: (text: string) => number): string {
  if (measure(text) <= width) return text;
  const chars = Array.from(text);
  while (chars.length && measure(`${chars.join('')}…`) > width) chars.pop();
  return measure('…') <= width ? `${chars.join('')}…` : '';
}

/** Wraps by word, also splitting a word that is too long; limits lines only when the caller asks. */
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

/** The spacing after a block: a block that goes with the next block (name -> time/price) is closer than the spacing between groups. */
function gapAfter(block: Pick<TextBlock, 'keepNext'>): number {
  return block.keepNext ? PNG.tightGap : PNG.gap;
}

/** Splits the paragraphs by the real height; keeps the day title with the next block and does not drop a line when moving to the next image. */
export function paginateBlocks(blocks: readonly TextBlock[], measure: MeasureText, top: number, bottom: number, nextTop: number): LayoutPage[] {
  const pages: { lines: { text: string; role: TextRole; y: number }[] }[] = [{ lines: [] }];
  let y = top;
  /** Repeats the day when the content continues on a later image so the recipient does not confuse the order of the days. */
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
    const height = block.lines.length * LINE_HEIGHT[block.role] + gapAfter(block);
    let reserve = 0;
    for (let next = index; wrapped[next]?.keepNext; next++) {
      const following = wrapped[next + 1];
      if (following) reserve += following.lines.length * LINE_HEIGHT[following.role] + gapAfter(following);
    }
    if (y + height + reserve > bottom && pages.at(-1)!.lines.length) nextPage(block.section);
    for (const text of block.lines) {
      if (y + LINE_HEIGHT[block.role] > bottom) nextPage(block.section);
      pages.at(-1)!.lines.push({ text, role: block.role, y });
      y += LINE_HEIGHT[block.role];
    }
    y += gapAfter(block);
  }
  return pages;
}
