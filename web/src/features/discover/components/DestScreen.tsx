import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useReveal } from '../../../shared/hooks/useReveal.ts';
import { monthRangeLabel } from '../../../shared/lib/text.ts';
import { goBack, navigate, useRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { TemplatesSection } from '../../templates/index.ts';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { COVER_FOCAL, DEFAULT_FOCAL } from '../model/discover.const.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { coverPlace, destBestMonths } from '../model/destinationQueries.ts';
import { pickedOf } from '../model/discoverState.ts';
import { DEST_COPY } from '../model/dest.copy.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { GuideSections } from './dest/GuideSections.tsx';
import { PlaceList } from './dest/PlaceList.tsx';
import { MapPeekButton } from './MapPeekButton.tsx';
import { MomentsSection } from './MomentsSection.tsx';
import { DestinationCredits } from './dest/DestinationCredits.tsx';
import { DestinationGuide } from './dest/DestinationGuide.tsx';
import { discoveryFilters } from '../model/discoveryFilters.ts';
import type { CategoryCode } from '../model/Catalog.types.ts';

/** One real summary line of the destination: the number of places and (if the catalog has it) the common good season. */
function destMeta(dest: DestinationDetail): string {
  const months = monthRangeLabel(destBestMonths(dest), '');
  return months ? fill(DEST_COPY.metaBest, { n: dest.places.length, months }) : fill(DEST_COPY.metaPlain, { n: dest.places.length });
}

/**
 * The compact top of the destination page: a low cover-photo strip (name, tagline, back) then the action row.
 * The single main action is 'Swipe to explore'; 'Selected', 'Create trip' and 'Map' are secondary actions of the same size, at least 44 px.
 */
function DestHead({ dest }: { readonly dest: DestinationDetail }) {
  const { state, actions } = useDiscover();
  const { sub } = useRoute();
  const picked = pickedOf(state, dest.places).length;
  const focal = COVER_FOCAL[coverPlace(dest)?.id ?? ''] ?? DEFAULT_FOCAL;
  return (
    <>
      <header className="dest-head">
        <RevealImage alt="" src={dest.coverUrl} style={{ objectPosition: focal }} />
        <div className="dh-top"><IconButton icon="chevron-left" label={COPY.common.back} onClick={goBack} /></div>
        <div className="dh-in">
          <p className="dh-region"><Icon name="map-pin" size="s" />{dest.region}</p>
          <h1>{dest.name}</h1>
          <p className="dh-tag">{dest.tagline}</p>
        </div>
        <DestinationGuide dest={dest} />
      </header>
      <div className="dest-actions pad-x">
        <p className="dest-meta">{destMeta(dest)}</p>
        <div className="da-main">
          <Button arrow icon="heart" onClick={() => { actions.setCategory(discoveryFilters(dest.places).includes(sub as CategoryCode) ? sub as CategoryCode : 'all'); navigate(VIEW.DECK, dest.id); }}>{DEST_COPY.swipe}</Button>
          <Button kind="ghost" icon="bookmarks" onClick={() => navigate(VIEW.PICKED)}>{fill(DEST_COPY.pickedCount, { n: picked })}</Button>
        </div>
      </div>
    </>
  );
}

/** The destination page: a compact top, the actions, the filter + the list of places, the moments, the guide and the sample itinerary (the map is the app frame's main map). */
function DestContent({ dest, onCreate }: { readonly dest: DestinationDetail; readonly onCreate: () => void }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <>
      <DestHead dest={dest} />
      <div ref={ref} className="dbody pad-x">
        <PlaceList dest={dest} />
        <MomentsSection key={dest.id} dest={dest} />
        <div className="da-sub">
          <Button kind="ghost" icon="plus" onClick={onCreate}>{DEST_COPY.createTrip}</Button>
          <MapPeekButton />
        </div>
        <h2 className="h2">{fill(COPY.dest.guideTitle, { dest: dest.name })}</h2>
        <GuideSections dest={dest} />
        <TemplatesSection destId={dest.id} />
        <DestinationCredits dest={dest} />
      </div>
    </>
  );
}

/** The destination screen (the guide). */
export function DestScreen({ destId, onCreate }: { readonly destId: string; readonly onCreate: () => void }) {
  return <DestinationGate destId={destId}>{(dest) => <DestContent dest={dest} onCreate={onCreate} />}</DestinationGate>;
}
