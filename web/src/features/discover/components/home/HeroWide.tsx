import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { cssVars } from '../../../../shared/lib/cssVars.ts';
import { Button } from '../../../../shared/ui/Button.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { HOME_PLACES } from '../../model/discover.const.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { firstPhotoUrl, placeById, placesInSeason } from '../../model/destinationQueries.ts';
import { SearchBox } from './SearchBox.tsx';

interface HeroWideProps {
  readonly dest: DestinationDetail;
  readonly query: string;
  readonly onQuery: (q: string) => void;
}

const HERO_IDS = [HOME_PLACES.PASS, HOME_PLACES.COVER, HOME_PLACES.RIVER] as const;

/** Hero trang chủ màn rộng: ảnh thật chuyển mờ, câu mời và ô tìm kiếm. Dòng "mùa đẹp" chỉ hiện khi kho có nơi đúng tháng này. */
export function HeroWide({ dest, query, onQuery }: HeroWideProps) {
  const month = new Date().getMonth() + 1;
  const inSeason = placesInSeason(dest, month);
  const eyebrow = inSeason.length
    ? fill(COPY.home.eyebrowSeason, { month, n: inSeason.length, dest: dest.name })
    : `${dest.name}${COPY.units.dot}${dest.tagline.toLowerCase()}`;
  return (
    <section className="hero-w">
      <div className="hero-ph" aria-hidden="true">
        {HERO_IDS.map((id, i) => (
          <figure key={id} className="hs" style={cssVars({ i })}>
            <img alt="" src={firstPhotoUrl(placeById(dest, id))} fetchPriority={i ? undefined : 'high'} />
          </figure>
        ))}
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-in">
        <p className="hero-eyebrow">
          <Icon name="sun" size="s" />
          {eyebrow}
        </p>
        <h1 className="hero-h">
          {COPY.home.heroTitleA}
          <br />
          {COPY.home.heroTitleB}
        </h1>
        <p className="hero-sub">{COPY.home.heroSub}</p>
        <div className="hero-act">
          <Button icon="hand-finger" onClick={() => navigate(VIEW.DECK, dest.id)}>
            {fill(COPY.home.startSwipeIn, { dest: dest.name })}
          </Button>
          <SearchBox value={query} onChange={onQuery} className="hero-search" />
        </div>
      </div>
    </section>
  );
}
