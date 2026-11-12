import { ApiError } from '../../../shared/api/ApiError.ts';
import { HTTP } from '../../../shared/api/http.const.ts';

/**
 * Does an error when re-reading a trip mean one is no longer in the trip (removed by the Organizer, or the trip was deleted)? Only a 404 from the server counts;
 * a dropped network, an ended session or a server error does NOT (the user must not be kicked out of a trip just because the network was lost).
 */
export function isTripGone(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP.NOT_FOUND;
}
