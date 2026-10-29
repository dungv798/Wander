import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { HomeSky } from './HomeSky.tsx';

/** Bản rộng giữ cùng hành vi hero điện thoại; kích thước thích ứng bằng CSS. */
export function HeroWide({ dest }: { readonly dest: DestinationDetail }) {
  return <HomeSky dest={dest} />;
}
