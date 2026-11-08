import { replaceRoute, useRoute } from '../../../../shared/router/hashRoute.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { fill } from '../../../../shared/const/copy.vi.ts';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import type { CategoryCode, DestinationDetail } from '../../model/Catalog.types.ts';
import { discoveryFilters, DISCOVERY_FILTER_LABELS, matchesDiscoveryFilter } from '../../model/discoveryFilters.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';
import { PlaceRow } from './PlaceRow.tsx';

/** Bộ lọc loại đang chọn: `all` hoặc một mã loại có thật trong điểm đến. */
type Filter = 'all' | CategoryCode;

/**
 * "Những nơi & trải nghiệm" của một điểm đến: hàng lọc theo loại (độ rộng theo chữ, cao ≥ 44 px) rồi danh sách thẻ nơi.
 * Dữ liệu là kho biên tập thật; "Chọn" ghi vào cùng trạng thái "Đã chọn" với bộ thẻ quẹt, nên hai nơi luôn khớp nhau.
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
