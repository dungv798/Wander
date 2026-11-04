import type { MomentTheme, MomentView } from './Catalog.types.ts';
import { ALL_MOMENTS, MOMENT_THEMES } from './moments.const.ts';

/** Chỉ nhận đối tượng thường để dữ liệu thiếu hoặc sai kiểu không làm hỏng màn hình. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Loại bản ghi thiếu caption, chủ đề hoặc thông tin ghi công bắt buộc. */
function isMoment(value: unknown): value is MomentView {
  if (!isRecord(value) || !isRecord(value['photo'])) return false;
  const photo = value['photo'];
  return ['id', 'themeLabel', 'caption'].every(key => typeof value[key] === 'string' && value[key].trim() !== '')
    && MOMENT_THEMES.some(theme => theme === value['theme'])
    && ['url', 'author', 'license', 'sourceUrl'].every(key => typeof photo[key] === 'string' && photo[key].trim() !== '');
}

/** Trường additive vắng mặt hoặc sai kiểu thành mảng rỗng; bỏ bản ghi hỏng và mã trùng. */
export function parseMoments(value: unknown): readonly MomentView[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter(isMoment).filter(moment => {
    if (seen.has(moment.id)) return false;
    seen.add(moment.id);
    return true;
  });
}

/** Chủ đề giữ thứ tự biên tập, mỗi chủ đề chỉ có một chip. */
export function momentThemes(moments: readonly MomentView[]): readonly { readonly theme: MomentTheme; readonly label: string }[] {
  return [...new Map(moments.map(moment => [moment.theme, { theme: moment.theme, label: moment.themeLabel }])).values()];
}

/** Lọc ổn định theo chủ đề, giữ nguyên thứ tự ảnh của kho biên tập. */
export function filterMoments(moments: readonly MomentView[], theme: MomentTheme | typeof ALL_MOMENTS): readonly MomentView[] {
  return theme === ALL_MOMENTS ? moments : moments.filter(moment => moment.theme === theme);
}
