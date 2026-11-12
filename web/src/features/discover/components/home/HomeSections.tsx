import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { todayLocal } from '../../../../shared/lib/dates.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { Button } from '../../../../shared/ui/Button.tsx';
import { SectionHead } from '../../../../shared/ui/SectionHead.tsx';
import { useTrips } from '../../../trips/index.ts';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { firstPhotoUrl, groupByCategory } from '../../model/destinationQueries.ts';
import { pickedOf } from '../../model/discoverState.ts';
import { HOME } from '../../model/home.const.ts';
import { HOME_MOOD_PHOTOS } from '../../model/homePhotos.const.ts';
import { homeTrip, resumeKind } from '../../model/homeSelection.ts';

interface SectionProps {
  readonly dest: DestinationDetail;
}

/** A single continue card: the trip in progress/Today first, then the places half-chosen; hidden when empty. */
export function ResumeSection({ dest }: SectionProps) {
  const { state } = useDiscover();
  const { state: trips } = useTrips();
  const today = todayLocal();
  const trip = homeTrip(trips.trips, today);
  const picked = pickedOf(state, dest.places);
  const kind = resumeKind(!!trip, picked.length);
  if (!kind) return null;
  const ongoing = trip && !trip.datesTentative && trip.startDate <= today && trip.endDate >= today;
  return (
    <section className="stack home-resume">
      <h2 className="h2">{trip ? COPY.home.continueTitle : COPY.home.resumeTitle}</h2>
      <button className="resume glass-control" type="button" onClick={() => trip ? navigate(ongoing ? VIEW.TODAY : VIEW.TRIP, trip.id) : navigate(VIEW.PICKED)}>
        {trip ? null : <RevealImage alt="" src={firstPhotoUrl(picked[0])} width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="lazy" />}
        <span>
          <b>{trip ? trip.name : fill(COPY.home.resumeCount, { n: picked.length })}</b>
          <span>{trip ? ongoing ? COPY.home.todayTrip : COPY.home.continueTrip : fill(COPY.home.resumeSub, { dest: dest.name })}</span>
        </span>
      </button>
    </section>
  );
}

/** At most five real moods, preferring the kind being chosen; see all opens the guide and the destination map. */
export function MoodSection({ dest }: SectionProps) {
  const { state, actions } = useDiscover();
  const groups = [...groupByCategory(dest).entries()];
  const list = groups.sort(([a], [b]) => Number(b === state.cat) - Number(a === state.cat)).slice(0, HOME.MOODS);
  return (
    <section className="stack home-moods">
      <SectionHead title={COPY.home.moods} right={<Button kind="ghost" onClick={() => navigate(VIEW.DEST, dest.id)}>{COPY.home.seeAll}</Button>} />
      <div className="hscroll moods">
        {list.map(([cat, places]) => (
          <button key={cat} className="mood" type="button" onClick={() => { actions.setCategory(cat); navigate(VIEW.DECK, dest.id); }}>
            <RevealImage alt="" src={HOME_MOOD_PHOTOS[dest.id]?.[cat] ? `/catalog/photos/${HOME_MOOD_PHOTOS[dest.id]?.[cat]?.file}` : firstPhotoUrl(places[0])} style={{ objectPosition: HOME_MOOD_PHOTOS[dest.id]?.[cat]?.position }} width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="lazy" />
            <span className="mood-in">
              <b>{places[0]?.categoryName}</b>
              <span>{fill(COPY.common.placeCountShort, { n: places.length })}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
