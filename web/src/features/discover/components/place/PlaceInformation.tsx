import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import type { DestinationDetail, PlaceView } from '../../model/Catalog.types.ts';
import { About, DataCredits, EditorialRate, Highlights, OsmLink, QuickFacts, SeasonMonths, Tips, TimeOfDay } from './PlaceBody.tsx';
import { PlaceDecisionLinks } from './PlaceDecisionLinks.tsx';
import { PlaceDisclosure } from './PlaceDisclosure.tsx';
import { PlaceRouteMap } from './PlaceRouteMap.tsx';

const PlaceRatingCard = lazy(() => import('../../../rating/index.ts').then(module => ({ default: module.PlaceRatingCard })));

/** The shared information column; on desktop the facts are placed here, on mobile the facts next to the photo are used, with no change to the data. */
export function PlaceInformation({ dest, place, extra, mapLink }: { readonly dest: DestinationDetail; readonly place: PlaceView; readonly extra?: ReactNode; readonly mapLink: boolean }) {
  return <div className={`pp place-information cat-${place.category}`}>
    {extra}
    <p className="pd-hook">{place.hook}</p>
    <div className="place-desktop-facts"><QuickFacts place={place} /></div>
    <Highlights place={place} />
    {!place.venue || place.bestSlots.length > 0 ? <TimeOfDay place={place} /> : null}
    {!place.venue || place.bestMonths.length > 0 ? <SeasonMonths place={place} /> : null}
    <Tips place={place} />
    <PlaceDecisionLinks dest={dest} place={place} />
    <About place={place} />
    <PlaceDisclosure title={COPY.place.howToGet} icon="route"><PlaceRouteMap dest={dest} place={place} />{mapLink ? <OsmLink place={place} /> : null}</PlaceDisclosure>
    <EditorialRate place={place} />
    <Suspense fallback={null}><PlaceRatingCard key={place.id} placeId={place.id} /></Suspense>
    <DataCredits place={place} />
  </div>;
}
