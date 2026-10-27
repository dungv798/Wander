import type { CSSProperties } from 'react';

/** Tạo `style` chứa biến CSS tùy biến từ một bảng tên→giá trị (tên KHÔNG có `--`), ví dụ `cssVars({ n: 2 })` → `--n: 2`. */
export function cssVars(vars: Readonly<Record<string, string | number>>): CSSProperties {
  const style: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(vars)) style[`--${k}`] = v;
  return style as CSSProperties;
}
