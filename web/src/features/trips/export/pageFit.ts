import { PNG } from './export.const.ts';
import { LINE_HEIGHT, paginateBlocks } from './textLayout.ts';
import type { LayoutPage, MeasureText, TextBlock } from './Export.types.ts';

/** Một ảnh đã có chiều cao riêng theo nội dung (không còn trang 1920 px gần như trắng). */
export interface SizedPage extends LayoutPage { readonly height: number }

/** Đáy của dòng cuối trong ảnh; ảnh rỗng thì trả `fallback`. */
function contentBottom(page: LayoutPage, fallback: number): number {
  const last = page.lines.at(-1);
  return last ? last.y + LINE_HEIGHT[last.role] : fallback;
}

/** Tham số chia ảnh: vùng đầu (có bìa), lề đầu các ảnh sau, phần chân trang giữ chỗ (ghi công + nhãn trang). */
export interface FitOptions { readonly top: number; readonly nextTop: number; readonly footer: number }

/**
 * Chia nội dung thành ít ảnh nhất có thể rồi CÂN các ảnh cho đều nhau, mỗi ảnh cao đúng bằng nội dung của nó (tối thiểu `PNG.minHeight`,
 * tối đa `PNG.maxHeight`). Việc cân tránh ảnh cuối chỉ có vài dòng; không cắt dòng nào và không tách tiêu đề ngày khỏi mục đầu.
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
