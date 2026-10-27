import { ICON_PATHS } from './iconPaths.const.ts';
import type { IconName } from './iconPaths.const.ts';

/** Đổi chuỗi (ví dụ tên biểu tượng từ dữ liệu biên tập) thành tên biểu tượng hợp lệ; không có trong bộ thì trả null thay vì vẽ ô trống. */
export function toIconName(name: string): IconName | null {
  return Object.prototype.hasOwnProperty.call(ICON_PATHS, name) ? (name as IconName) : null;
}
