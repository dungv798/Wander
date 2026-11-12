import { COPY } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { SectionHead } from '../../../../shared/ui/SectionHead.tsx';
import { useCurrentDestination } from '../../hooks/CurrentDestinationProvider.tsx';
import { HOME } from '../../model/home.const.ts';
import { DestinationCard } from './DestinationCard.tsx';

/** A short row of other destinations (once a destination has been chosen); the first-time home page uses `NationalHome`. */
export function DestinationRail() {
  const { destinations, selectedId, select, status, retry } = useCurrentDestination();
  const list = destinations.filter(destination => destination.id !== selectedId).slice(0, HOME.OTHER_DESTINATIONS);
  return (
    <section className="stack other-destinations" aria-label={COPY.home.otherDestinations}>
      <SectionHead title={COPY.home.otherDestinations} />
      {status === 'loading' ? <p role="status">{COPY.common.loading}</p> : null}
      {status === 'error' ? <button type="button" className="btn" onClick={retry}>{COPY.common.retry}</button> : null}
      <div className="hscroll destination-rail">
        {list.map(destination => <DestinationCard key={destination.id} destination={destination} onSelect={() => { select(destination.id); navigate(VIEW.EXPLORE); }} />)}
      </div>
    </section>
  );
}
