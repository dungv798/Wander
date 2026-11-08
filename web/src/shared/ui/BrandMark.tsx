import { COPY } from '../const/copy.vi.ts';
import { Icon } from './Icon.tsx';

/** Dấu thương hiệu dùng cùng biểu tượng la bàn và tên ở đầu trang lẫn phần giới thiệu. */
export function BrandMark({ className }: { readonly className?: string }) {
  return <p className={['brand-mark', className].filter(Boolean).join(' ')}><Icon name="compass" /><span>{COPY.brand.name}</span></p>;
}
