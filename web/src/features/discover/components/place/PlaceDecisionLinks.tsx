import type { DestinationDetail, PlaceView } from '../../model/Catalog.types.ts';
import { DISCOVER_COPY as C } from '../../model/discover.copy.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { safeHttpUrl } from '../../../../shared/lib/safeUrl.ts';
import { fill } from '../../../../shared/const/copy.vi.ts';

/** Opens a search with the name and region to see current information; it does not fake a Google rating when there is no API data. */
export function PlaceDecisionLinks({ dest, place }: { readonly dest: DestinationDetail; readonly place: PlaceView }) {
  // only http(s): blocks javascript:/data: from catalog data before it goes into href
  const website = safeHttpUrl(place.venue?.website);
  const source = safeHttpUrl(place.venue?.sourceUrl);
  const params = new URLSearchParams({ api: '1', query: `${place.name}, ${place.area}, ${dest.name}, Việt Nam` });
  return <section className="place-info-card place-decision-links">
    <h4><Icon name="info-circle" />{C.beforeGo}</h4>
    {place.venue ? <p className="place-venue-address"><Icon name="map-pin" />{place.venue.address}</p> : null}
    {place.venue?.phone ? <p className="place-venue-address"><Icon name="info-circle" />{C.venue.phone}: {place.venue.phone}</p> : null}
    <p className="note">{C.beforeGoNote}</p>
    {place.venue && website ? <a className="place-source-link" href={website} target="_blank" rel="noopener noreferrer"><Icon name={place.venue.kind === 'lodging' ? 'bed' : 'tools-kitchen-2'} /><span><b>{place.venue.kind === 'lodging' ? C.venue.rooms : C.venue.menu}</b><small>{C.venue.website}</small></span><Icon name="chevron-left" className="flip" /></a> : null}
    <a className="place-source-link" href={`https://www.google.com/maps/search/?${params}`} target="_blank" rel="noopener noreferrer">
      <Icon name="map-pin" />
      <span><b>{C.googleMaps}</b><small>{C.googleMapsNote}</small></span>
      <Icon name="chevron-left" className="flip" />
    </a>
    {place.venue && source ? <a className="place-source-link" href={source} target="_blank" rel="noopener noreferrer"><Icon name="info-circle" /><span><b>{C.venue.source}</b><small>{fill(C.venue.checked, { date: place.venue.checkedAt })}</small></span><Icon name="chevron-left" className="flip" /></a> : null}
  </section>;
}
