import { ICON_PATHS } from './icons/iconPaths.const.ts';
import type { IconName } from './icons/iconPaths.const.ts';

/** Cỡ biểu tượng: mặc định 20 px; s 16; l 26; xl 30 (CSS `.ic`). */
export type IconSize = 's' | 'l' | 'xl';

interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  /** Lớp CSS thêm (ví dụ xoay). */
  readonly className?: string;
}

/** Biểu tượng Tabler (SVG nội tuyến, trang trí: ẩn với trình đọc màn hình; nhãn do nút bao quanh cung cấp). */
export function Icon({ name, size, className }: IconProps) {
  const cls = ['ic', size, className].filter(Boolean).join(' ');
  return <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }} />;
}
