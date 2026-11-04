import { COPY } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { todayLocal } from '../../../../shared/lib/dates.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { useTrips } from '../../../trips/index.ts';
import { useCurrentDestination } from '../../hooks/CurrentDestinationProvider.tsx';
import { HOME } from '../../model/home.const.ts';
import { homeTrip } from '../../model/homeSelection.ts';
import { HomeHeader } from './HomeHeader.tsx';
import { HomeBanner } from './HomeBanner.tsx';
import { DestinationCard } from './DestinationCard.tsx';

/** Thẻ "Tiếp tục chuyến của bạn" ở trang chủ khi chưa chọn điểm đến nhưng đã có chuyến; nằm trước các khối khám phá. */
function TripResume() {
  const { state } = useTrips();
  const today = todayLocal();
  const trip = homeTrip(state.trips, today);
  if (!trip) return null;
  const ongoing = !trip.datesTentative && trip.startDate <= today && trip.endDate >= today;
  return (
    <section className="stack home-resume" aria-label={COPY.home.continueTitle}>
      <h2 className="h2">{COPY.home.continueTitle}</h2>
      <button className="resume glass-control" type="button" onClick={() => navigate(ongoing ? VIEW.TODAY : VIEW.TRIP, trip.id)}>
        <span><b>{trip.name}</b><span>{ongoing ? COPY.home.todayTrip : COPY.home.continueTrip}</span></span>
      </button>
    </section>
  );
}

/**
 * Trang chủ lần đầu (chưa chọn điểm đến): một tiêu đề, thanh tìm, dải giới thiệu cao vừa phải rồi lưới hai cột điểm đến để thấy ngay nhiều nơi.
 * Chọn một thẻ là lưu điểm đến và mở bộ thẻ quẹt của nơi đó.
 */
export function NationalHome() {
  const { destinations, status, retry, select } = useCurrentDestination();
  const list = destinations.slice(0, HOME.DESTINATIONS);
  return (
    <div className="national-home pad-x">
      <HomeHeader />
      <TripResume />
      <HomeBanner />
      <section aria-label={COPY.home.featuredDestinations}>
        <h2 className="h2">{COPY.home.featuredDestinations}</h2>
        {status === 'loading' ? <p role="status">{COPY.common.loading}</p> : null}
        {status === 'error' ? <button type="button" className="btn" onClick={retry}>{COPY.common.retry}</button> : null}
        <ul className="nh-grid">
          {list.map((destination) => (
            <li key={destination.id}>
              <DestinationCard destination={destination} onSelect={() => { select(destination.id); navigate(VIEW.DECK, destination.id); }} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
