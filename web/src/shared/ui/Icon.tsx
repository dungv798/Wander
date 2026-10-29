import { ICON_PATHS } from './icons/iconPaths.const.ts';
import type { IconName } from './icons/iconPaths.const.ts';
import { FLUENT_ICONS, FLUENT_PATH, FLUENT_SIZE, FLUENT_SUFFIX } from './icons/fluentIcons.const.ts';
import { LOOK } from '../const/look.const.ts';

/** Cỡ biểu tượng: mặc định 20 px; s 16; l 26; xl 30 (CSS `.ic`). */
export type IconSize = 's' | 'l' | 'xl';

interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  /** Lớp CSS thêm (ví dụ xoay). */
  readonly className?: string;
  /** Ngữ nghĩa địa điểm/thời gian; điều khiển mặc định luôn dùng SVG. */
  readonly semantic?: boolean;
}

/** Biểu tượng Tabler (SVG nội tuyến, trang trí: ẩn với trình đọc màn hình; nhãn do nút bao quanh cung cấp). */
export function Icon({ name, size, className, semantic = false }: IconProps) {
  const cls = ['ic', size, className].filter(Boolean).join(' ');
  const fluent = semantic && FLUENT_ICONS[name];
  if (fluent && document.documentElement.dataset.look !== LOOK.CLASSIC) {
    const pixels = FLUENT_SIZE[size ?? 'default'];
    return <img className={`${cls} fluent-icon`} src={`${FLUENT_PATH}${fluent}${FLUENT_SUFFIX}`} width={pixels} height={pixels} decoding="async" alt="" aria-hidden="true" />;
  }
  return <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }} />;
}
