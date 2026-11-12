import { TRIP_IMAGES } from '../model/tripImages.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { firstPhotoUrl } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { COLLAB_COPY } from '../../collab/index.ts';
import { coverUrl, gradientStyle } from '../model/cover.ts';
import type { Trip } from '../model/trip.types.ts';
import { countText } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { dateRangeText } from './TripCard.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';

interface TripCoverHeadProps {
  readonly trip: Trip;
  readonly dest: DestinationDetail;
  /** Opens the 'Travel companions' sheet (invite, members, permissions). */
  readonly onPeople: () => void;
  /** Compact: the name + dates on one row, two buttons with only icons (the label is still there for screen readers). Used in the list tabs so the schedule items sit higher. */
  readonly compact?: boolean;
}

/**
 * The trip cover at the top of the sheet: the photo (or the chosen cover color), the name, the dates, the number of items, and the group of sharing actions right on the cover:
 * 'Travel companions' (invite by link, members, requests) and 'Share the schedule' (save/send the itinerary).
 * `compact` shrinks the cover to a low strip (Schedule/Not scheduled/Cost tabs); the Overview tab keeps the full cover.
 */
export function TripCoverHead({ trip, dest, onPeople, compact = false }: TripCoverHeadProps) {
  const { setOverlay } = useTripView();
  const first = trip.items.map((i) => dest.places.find((p) => p.id === i.placeId)).find(Boolean);
  const image = coverUrl(trip.cover, dest, first ? firstPhotoUrl(first) : dest.coverUrl);
  return (
    <div className="trip-cover-card" data-compact={compact || undefined} data-cover={gradientStyle(trip.cover) ? 'gradient' : 'photo'} style={gradientStyle(trip.cover)}>
      {/* The cover at the top of the screen can be the LCP, keep it loading at once instead of lazy. */}
      {image ? <img decoding="async" width={TRIP_IMAGES.COVER.width} height={TRIP_IMAGES.COVER.height} alt="" src={image} /> : null}
      <div className="tcc-in">
        <h1>{trip.name}</h1>
        <p>{`${dateRangeText(trip)} · ${countText(trip)}`}</p>
      </div>
      <div className="tcc-actions">
        <Button kind="ghost" icon="users" onClick={onPeople}>
          <span className="tcc-label">{trip.memberCount > 1 ? fill(COLLAB_COPY.people.open, { n: trip.memberCount }) : T.create.invite}</span>
        </Button>
        <Button kind="ghost" icon="share-2" onClick={() => setOverlay({ kind: 'share' })}>
          <span className="tcc-label">{T.view.share}</span>
        </Button>
      </div>
    </div>
  );
}
