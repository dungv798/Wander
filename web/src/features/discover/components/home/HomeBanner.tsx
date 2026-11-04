import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { HOME_COPY } from '../../model/home.copy.ts';
import { HOME_BANNER } from '../../model/homePhotos.const.ts';
import { HERO_PHOTOS } from '../../model/heroPhotos.const.ts';

/** Một câu mời trên mảng nền riêng; banner đã chọn thấp hơn và mở đúng bộ thẻ. */
export function HomeBanner({ dest }: { readonly dest?: DestinationDetail }) {
  const file = dest ? HERO_PHOTOS[dest.id]?.[0] : HOME_BANNER.file;
  const src = file ? `/catalog/photos/${file}` : dest?.coverUrl;
  return (
    <button className={`nh-intro${dest ? ' nh-intro-selected' : ''}`} type="button" onClick={() => navigate(dest ? VIEW.DECK : VIEW.DESTINATIONS, dest?.id)} aria-label={dest ? fill(COPY.home.exploreDestination, { dest: dest.name }) : COPY.home.searchDestinations}>
      <RevealImage src={src} style={{ objectPosition: HOME_BANNER.position }} alt="" width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="eager" />
      <span className="nh-invitation"><b>{dest ? HOME_COPY.selectedInvitation : HOME_COPY.invitation}</b><Icon name="compass" /></span>
    </button>
  );
}
