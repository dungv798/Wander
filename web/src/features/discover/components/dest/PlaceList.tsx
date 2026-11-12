import { replaceRoute, useRoute } from '../../../../shared/router/hashRoute.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { fill } from '../../../../shared/const/copy.vi.ts';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import type { CategoryCode, DestinationDetail } from '../../model/Catalog.types.ts';
import { discoveryFilters, DISCOVERY_FILTER_LABELS, matchesDiscoveryFilter } from '../../model/discoveryFilters.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';
import { PlaceRow } from './PlaceRow.tsx';

/** The selected kind filter: `all` or a kind code that really exists in the destination. */
type Filter = 'all' | CategoryCode;

/**
 * 'Places & experiences' of a destination: a filter row by kind (width by text, height at least 44 px) then the list of place cards.
 * The data is the real editorial catalog; 'Select' writes into the same 'Selected' state as the swipe deck, so the two places always match.
 */
export function PlaceList({ dest }: { readonly dest: DestinationDetail }) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const categories = discoveryFilters(dest.places);
  const { sub } = useRoute();
  const filter: Filter = categories.includes(sub as CategoryCode) ? sub as CategoryCode : 'all';
  const setFilter = (next: Filter): void => replaceRoute(VIEW.DEST, dest.id, next === 'all' ? null : next);
  const shown = dest.places.filter((p) => matchesDiscoveryFilter(p, filter));
  return (
    <section className="place-list" aria-label={DEST_COPY.listTitle}>
      <div className="pl-head">
        <h2 className="h2">{DEST_COPY.listTitle}</h2>
        <span className="pl-count">{fill(DEST_COPY.suggestions, { n: shown.length })}</span>
      </div>
      {categories.length > 1 ? (
        <div className="pl-filters" role="group" aria-label={DEST_COPY.filterLabel}>
          <button className="fchip" type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{DEST_COPY.all}</button>
          {categories.filter(c => c !== 'all').map((c) => <button key={c} className="fchip" type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}>{DISCOVERY_FILTER_LABELS[c]}</button>)}
        </div>
      ) : null}
      {shown.length ? (
        <ul className="pl-rows">
          {shown.map((p) => {
            const chosen = state.decisions[p.id] === 'like';
            return <PlaceRow key={p.id} place={p} chosen={chosen} onOpen={() => sheet.open(p.id)} onToggle={() => (chosen ? actions.unpick(p.id) : actions.decide(p.id, 'like'))} />;
          })}
        </ul>
      ) : <p className="note">{DEST_COPY.emptyFilter}</p>}
    </section>
  );
}
