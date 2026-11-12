import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { DISCOVER_COPY } from '../../model/discover.copy.ts';
import { CreditPill } from '../CreditPill.tsx';

/** Full attribution of the cover photo and every photo used on the destination card, the places and the moments; merges photos with the same URL. */
export function DestinationCredits({ dest }: { readonly dest: DestinationDetail }) {
  const all = [...(dest.coverPhoto ? [dest.coverPhoto] : []), ...dest.places.flatMap(p => p.photos), ...(dest.moments ?? []).map(m => m.photo)];
  const photos = [...new Map(all.map(photo => [photo.url, photo])).values()];
  if (!photos.length) return null;
  return <details className="destination-credits">
    <summary>{DISCOVER_COPY.photoSources}</summary>
    <div>{photos.map(photo => <CreditPill key={photo.url} photo={photo} fullAuthor />)}</div>
  </details>;
}
