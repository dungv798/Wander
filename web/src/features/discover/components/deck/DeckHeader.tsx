import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import { CATEGORY_ICON } from '../../model/discover.const.ts';
import type { AddingMode } from '../../model/addingMode.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { categoriesOf } from '../../model/destinationQueries.ts';
import { pickedOf } from '../../model/discoverState.ts';

/** Thanh trên của bộ thẻ: quay lại, tên điểm đến + tiến độ, nút xem các nơi đã chọn. */
export function DeckBar({ dest, adding }: { readonly dest: DestinationDetail; readonly adding?: AddingMode }) {
  const { state } = useDiscover();
  const seen = dest.places.filter((p) => state.decisions[p.id]).length;
  const picked = pickedOf(state, dest.places).length;
  return (
    <div className="deckbar pad-x">
      <IconButton icon="chevron-left" label={COPY.common.back} onClick={() => (adding ? adding.onDone() : navigate(VIEW.DEST, dest.id))} />
      <div className="mid">
        <h1>{adding ? adding.title : dest.name}</h1>
        <p className="note">{adding ? COPY.deck.addingNote : fill(COPY.deck.seen, { seen, total: dest.places.length })}</p>
      </div>
      <button className="pill" type="button" onClick={() => (adding ? adding.onDone() : navigate(VIEW.PICKED))}>
        <Icon name="check" size="s" />
        {adding ? COPY.deck.addingSave : fill(COPY.deck.viewPicked, { n: picked })}
      </button>
    </div>
  );
}

/** Bộ lọc theo loại (chọn một loại hoặc tất cả); mỗi nút là công tắc `aria-pressed`. */
export function DeckFilters({ dest }: { readonly dest: DestinationDetail }) {
  const { state, actions } = useDiscover();
  const names = new Map(dest.places.map((p) => [p.category, p.categoryName]));
  return (
    <div className="filters pad-x" role="group" aria-label={COPY.deck.filterLabel}>
      <button className="fchip" type="button" aria-pressed={state.cat === 'all'} onClick={() => actions.setCategory('all')}>
        {COPY.deck.filterAll}
      </button>
      {categoriesOf(dest).map((c) => (
        <button key={c} className={`fchip cat-${c}`} type="button" aria-pressed={state.cat === c} onClick={() => actions.setCategory(c)}>
          <Icon name={CATEGORY_ICON[c]} size="s" />
          {names.get(c)}
        </button>
      ))}
    </div>
  );
}
