import { PNG } from './export.const.ts';
import { LINE_HEIGHT, paginateBlocks } from './textLayout.ts';
import type { LayoutPage, MeasureText, TextBlock } from './Export.types.ts';

/** An image that already has its own height by content (no more almost-blank 1920 px page). */
export interface SizedPage extends LayoutPage { readonly height: number }

/** The bottom of the last line in an image; an empty image returns `fallback`. */
function contentBottom(page: LayoutPage, fallback: number): number {
  const last = page.lines.at(-1);
  return last ? last.y + LINE_HEIGHT[last.role] : fallback;
}

/** The image-splitting parameters: the head area (with the cover), the top margin of the later images, the reserved footer (attribution + page label). */
export interface FitOptions { readonly top: number; readonly nextTop: number; readonly footer: number }

/**
 * Splits the content into as few images as possible and then BALANCES the images evenly, each image exactly as tall as its content (at least `PNG.minHeight`,
 * at most `PNG.maxHeight`). The balancing avoids a last image with only a few lines; no line is cut and a day title is not separated from its first item.
 */
export function fitPages(blocks: readonly TextBlock[], measure: MeasureText, options: FitOptions): SizedPage[] {
  const { top, nextTop, footer } = options;
  const limit = PNG.maxHeight - footer - PNG.gap;
  let pages = paginateBlocks(blocks, measure, top, limit, nextTop);
  const count = pages.length;
  if (count > 1) {
    const total = pages.reduce((sum, page, i) => sum + contentBottom(page, i ? nextTop : top) - (i ? nextTop : top), 0);
    for (let target = top + Math.ceil(total / count); target < limit; target += LINE_HEIGHT.small) {
      const balanced = paginateBlocks(blocks, measure, top, target, nextTop);
      if (balanced.length <= count) { pages = balanced; break; }
    }
  }
  return pages.map((page, i) => ({
    ...page,
    height: Math.min(PNG.maxHeight, Math.max(PNG.minHeight, contentBottom(page, i ? nextTop : top) + PNG.gap + footer)),
  }));
}
