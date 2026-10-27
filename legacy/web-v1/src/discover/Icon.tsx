import { ICON_PATHS } from './iconPaths';

/**
 * Biểu tượng Tabler (MIT) vẽ inline. Đường vẽ là hằng số của chúng ta (iconPaths.ts), không phải dữ liệu người dùng,
 * nên dùng dangerouslySetInnerHTML an toàn. Trang trí (aria-hidden): chữ luôn đi kèm khi biểu tượng mang nghĩa.
 */
export function Icon({ name, size }: { name: string; size?: 's' | 'l' | 'xl' }) {
  const paths = Object.hasOwn(ICON_PATHS, name) ? (ICON_PATHS[name] ?? '') : '';
  return (
    <svg
      className={size ? `ic ${size}` : 'ic'}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}
