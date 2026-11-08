import { COPY } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { todayLocal } from '../../../../shared/lib/dates.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { useTrips } from '../../../trips/index.ts';
import { useCurrentDestination } from '../../hooks/CurrentDestinationProvider.tsx';
import { HOME, HOME_TOPICS, HOME_DESTINATION_ORDER } from '../../model/home.const.ts';
import { useDiscoveryTopic } from '../../hooks/DiscoveryTopicProvider.tsx';
import { homeTrip } from '../../model/homeSelection.ts';
import { HomeHeader } from './HomeHeader.tsx';
import { HOME_COPY } from '../../model/home.copy.ts';
import { HomeHero } from './HomeHero.tsx';
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
 * Trang chủ lần đầu (chưa chọn điểm đến): đầu trang gọn (dấu + thanh tìm), một hero điểm đến gợi ý có nút chính, rồi lưới thẻ ảnh để thấy ngay nhiều nơi.
 * Chọn hero hay một thẻ là lưu điểm đến và mở bộ thẻ quẹt của nơi đó.
 */
export function NationalHome() {
  const { select } = useCurrentDestination();
  const { destinations, status, retry, topic, setTopic } = useDiscoveryTopic();
  // Hiện MỌI điểm đến của kho danh mục (số lượng do backend quyết định, không hard-code).
  const featured = destinations.find((destination) => destination.id === HOME.FEATURED_ID) ?? destinations[0];
  const rank = new Map(HOME_DESTINATION_ORDER.map((id, index) => [id, index]));
  const list = destinations.filter(destination => destination.id !== featured?.id).sort((a, b) => (rank.get(a.id) ?? HOME_DESTINATION_ORDER.length) - (rank.get(b.id) ?? HOME_DESTINATION_ORDER.length));
  const open = (id: string): void => { select(id); navigate(VIEW.DEST, id, topic === 'all' ? null : topic); };
  return (
    <div className="national-home pad-x">
      <HomeHeader />
      <div className="pl-filters home-topics" role="group" aria-label={COPY.home.moods}>{HOME_TOPICS.map(code => <button className="fchip" type="button" key={code} aria-pressed={topic === code} onClick={() => setTopic(code)}>{HOME_COPY.topics[code]}</button>)}</div>
      <TripResume />
      {featured ? <HomeHero destination={featured} eyebrow={HOME_COPY.featuredEyebrow} cta={HOME_COPY.explore} onOpen={() => open(featured.id)} /> : null}
      <section aria-label={COPY.home.featuredDestinations}>
        <h2 className="h2">{COPY.home.featuredDestinations}</h2>
        {status === 'loading' ? <p role="status">{COPY.common.loading}</p> : null}
        {status === 'error' ? <button type="button" className="btn" onClick={retry}>{COPY.common.retry}</button> : null}
        <ul className="nh-grid">
          {list.map((destination) => (
            <li key={destination.id}>
              <DestinationCard destination={destination} onSelect={() => open(destination.id)} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
