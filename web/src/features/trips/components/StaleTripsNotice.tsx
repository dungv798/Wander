import { fill } from '../../../shared/const/copy.vi.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import './staleNotice.css';

/** Refreshes the '... minutes ago' label every minute (milliseconds). */
const REFRESH_MS = 60_000;

/**
 * The strip 'viewing the copy saved at ...' when the server does not answer but a previous copy of the trip exists (B-09): the user knows the data may be old and
 * cannot edit yet, with a Retry button. Not shown when the data is the latest copy from the server.
 */
export function StaleTripsNotice() {
  const { staleSince, reload } = useTrips();
  const now = useNow(REFRESH_MS);
  if (staleSince === null) return null;
  return (
    <div className="stale-notice pad-x" role="status">
      <p>{fill(T.stale.text, { ago: agoText(staleSince, now) })}</p>
      <Button kind="ghost" onClick={reload}>{T.stale.retry}</Button>
    </div>
  );
}
