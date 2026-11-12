import { useSyncExternalStore } from 'react';
import { pendingRequests } from '../api/PendingTracker.ts';
import { COPY } from '../const/copy.vi.ts';
import './slowNotice.css';

/**
 * The shared 'server is waking up' strip (B-05): shown when an API call hangs past `SLOW_REQUEST_AFTER_MS`, it disappears when the call is done.
 * It is the single source of this notice, so the loading screen, saving a trip or any action waiting for the server is explained the same way.
 */
export function SlowServerNotice() {
  const slow = useSyncExternalStore(pendingRequests.subscribe, () => pendingRequests.slow);
  if (!slow) return null;
  return <p className="slow-notice" role="status">{COPY.common.slowLoad}</p>;
}
