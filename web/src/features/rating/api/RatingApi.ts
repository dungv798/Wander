import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { RATING_API as R } from '../model/rating.const.ts';
import type { PlaceRating } from '../model/rating.types.ts';
import { toPlaceRating } from './ratingMapper.ts';

/** The `/api/places/{placeRef}/rating` contract of the backend; the client is injected so it can be tried without a network. */
export class RatingApi {
  private readonly client: ApiClient;

  /** Uses the shared client (with this device's Bearer already attached). */
  constructor(client: ApiClient = apiClient) { this.client = client; }

  /** The rating path of a venue; the venue id is URL-encoded. */
  private path(placeId: string): string {
    return `${R.PLACE}/${encodeURIComponent(placeId)}/${R.RATING}`;
  }

  /** The rating of a venue for the viewer. */
  async view(placeId: string, signal?: AbortSignal): Promise<PlaceRating> {
    return toPlaceRating(await this.client.get<unknown>(this.path(placeId), signal));
  }

  /** Rates or edits the score; an empty `comment` => no comment. */
  async rate(placeId: string, stars: number, comment: string): Promise<PlaceRating> {
    const body = comment.trim() ? { stars, comment } : { stars };
    return toPlaceRating(await this.client.send<unknown>('PUT', this.path(placeId), body));
  }

  /** Deletes one's own score. */
  async remove(placeId: string): Promise<PlaceRating> {
    return toPlaceRating(await this.client.send<unknown>('DELETE', this.path(placeId)));
  }

  /** Reports a comment. */
  async report(placeId: string, ratingId: string): Promise<void> {
    await this.client.send('POST', `${R.PLACE}/${encodeURIComponent(placeId)}/${R.REPORT}/${encodeURIComponent(ratingId)}/report`);
  }
}
