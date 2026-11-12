import { currentToken } from '../state/sessionToken.ts';
import { ApiClient } from './ApiClient.ts';
import { pendingRequests } from './PendingTracker.ts';

/** The authentication header of each call: this device's Bearer if there is a session; taken fresh each time so a session change takes effect at once. */
function authHeaders(): Record<string, string> {
  const token = currentToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** The app's shared HTTP client (a single instance), attaching this device's Bearer when there is one. */
export const apiClient = new ApiClient(undefined, authHeaders, pendingRequests);
