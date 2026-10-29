import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { SectionHead } from '../../../../shared/ui/SectionHead.tsx';
import { useCurrentDestination } from '../../hooks/CurrentDestinationProvider.tsx';
import { HOME } from '../../model/home.const.ts';
import { HERO_PHOTOS } from '../../model/heroPhotos.const.ts';
import { SearchBox } from './SearchBox.tsx';

/** Carousel toàn quốc khi chưa chọn; hàng ngắn loại điểm đến hiện tại khi đã chọn. */
export function DestinationRail({ national = false }: { readonly national?: boolean }) {
  const { destinations, selectedId, select, status, retry } = useCurrentDestination();
  const list = destinations.filter(destination => national || destination.id !== selectedId).slice(0, national ? HOME.DESTINATIONS : HOME.OTHER_DESTINATIONS);
  return (
    <section className={national ? 'home-hero national-hero' : 'stack other-destinations'} aria-label={national ? COPY.home.vietnam : COPY.home.otherDestinations}>
      {national ? <div className="national-heading"><p>{COPY.home.vietnam}</p><h1>{COPY.destinations.title}</h1><SearchBox /></div> : <SectionHead title={COPY.home.otherDestinations} />}
      {status === 'loading' ? <p role="status">{COPY.common.loading}</p> : null}
      {status === 'error' ? <button type="button" className="btn" onClick={retry}>{COPY.common.retry}</button> : null}
      <div className="hscroll destination-rail">
        {list.map(destination => <button className="destination-card" key={destination.id} type="button" onClick={() => { select(destination.id); navigate(national ? VIEW.DECK : VIEW.EXPLORE, national ? destination.id : undefined); }}>
          <RevealImage src={HERO_PHOTOS[destination.id]?.[0] ? `/catalog/photos/${HERO_PHOTOS[destination.id]?.[0]}` : destination.coverUrl} alt="" width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="lazy" />
          <span><b>{destination.name}</b><small>{fill(COPY.common.placeCountShort, { n: destination.placeCount })}</small></span>
        </button>)}
      </div>
    </section>
  );
}
