import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { Button } from '../../../../shared/ui/Button.tsx';
import { useHeroImages } from '../../hooks/useHeroImages.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { heroImages } from '../../model/homeSelection.ts';
import { SearchBox } from './SearchBox.tsx';
import { DeferredHeroVideo } from './DeferredHeroVideo.tsx';

/** Hero ảnh thật dùng cùng cấu trúc ở mọi cỡ màn; liên kết phủ ảnh không lồng các điều khiển. */
export function HomeSky({ dest }: { readonly dest: DestinationDetail }) {
  const images = heroImages(dest);
  const { index, setPaused } = useHeroImages(images.length);
  return (
    <section className="home-hero" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="home-hero-photos" aria-hidden="true">
        {images.map((src, i) => <RevealImage key={src} className={i === index ? 'is-active' : ''} src={src} alt="" width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="lazy" />)}
      </div>
      <a className="home-hero-link" href={`#/${VIEW.DECK}/${dest.id}`} aria-label={fill(COPY.home.exploreDestination, { dest: dest.name })} />
      <DeferredHeroVideo />
      <div className="home-hero-content">
        <p className="home-hero-brand">{COPY.brand.name}</p>
        <button className="pill home-destination-switch" type="button" aria-label={fill(COPY.home.changeDestination, { dest: dest.name })} onClick={() => navigate(VIEW.DESTINATIONS)}>{dest.name}<span aria-hidden="true">{COPY.home.destinationChevron}</span></button>
        <h1>{dest.name}</h1>
        <p className="home-hero-tagline">{dest.tagline}</p>
        <div className="home-hero-actions">
          <SearchBox />
          <Button icon="hand-finger" onClick={() => navigate(VIEW.DECK, dest.id)}>{COPY.home.exploreAction}</Button>
        </div>
      </div>
    </section>
  );
}
