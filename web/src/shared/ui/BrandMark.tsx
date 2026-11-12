import { COPY } from '../const/copy.vi.ts';
import { Icon } from './Icon.tsx';

/** The brand mark uses the same compass icon and name at the top of the page and in the intro. */
export function BrandMark({ className }: { readonly className?: string }) {
  return <p className={['brand-mark', className].filter(Boolean).join(' ')}><Icon name="compass" /><span>{COPY.brand.name}</span></p>;
}
