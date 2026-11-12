import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { useState } from 'react';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { goBack, navigate } from '../../../../shared/router/hashRoute.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import { CATEGORY_ICON } from '../../model/discover.const.ts';
import type { AddingMode } from '../../model/addingMode.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { discoveryFilters, DISCOVERY_FILTER_LABELS } from '../../model/discoveryFilters.ts';
import { pickedOf } from '../../model/discoverState.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';

/** The top bar of the deck: back, the destination name + progress, the button to see the selected places. */
export function DeckBar({ dest, adding, remaining }: { readonly dest: DestinationDetail; readonly adding?: AddingMode; readonly remaining: number }) {
  const { state } = useDiscover();
  const [filterOpen, setFilterOpen] = useState(false);
  const picked = pickedOf(state, dest.places).length;
  return (
    <div className="deckbar pad-x">
      <IconButton icon="chevron-left" label={COPY.common.back} onClick={goBack} />
      <div className="mid">
        <h1><button type="button" className="deck-filter-toggle" aria-label={COPY.deck.filterLabel} aria-expanded={filterOpen} onClick={() => setFilterOpen(open => !open)}>{adding ? adding.title : dest.name}<Icon name="chevron-down" size="s" /></button></h1>
        <p className="note">{adding ? COPY.deck.addingNote : fill(DEST_COPY.remaining, { n: remaining })}</p>
      </div>
      <button className="pill" type="button" aria-label={adding ? COPY.deck.addingSave : fill(DEST_COPY.pickedCount, { n: picked })} onClick={() => (adding ? adding.onDone() : navigate(VIEW.PICKED))}>
        <Icon name="bookmarks" size="s" />
        {adding ? COPY.deck.addingSave : picked}
      </button>
      {filterOpen ? <DeckFilters dest={dest} /> : null}
    </div>
  );
}

/** The filter by kind (choose one kind or all); each button is an `aria-pressed` toggle. */
export function DeckFilters({ dest }: { readonly dest: DestinationDetail }) {
  const { state, actions } = useDiscover();
  return (
    <div className="filters pad-x" role="group" aria-label={COPY.deck.filterLabel}>
      <button className="fchip" type="button" aria-pressed={state.cat === 'all'} onClick={() => actions.setCategory('all')}>
        {COPY.deck.filterAll}
      </button>
      {discoveryFilters(dest.places).filter(c => c !== 'all').map((c) => (
        <button key={c} className={`fchip cat-${c}`} type="button" aria-pressed={state.cat === c} onClick={() => actions.setCategory(c)}>
          <Icon semantic name={CATEGORY_ICON[c]} size="s" />
          {DISCOVERY_FILTER_LABELS[c]}
        </button>
      ))}
    </div>
  );
}
