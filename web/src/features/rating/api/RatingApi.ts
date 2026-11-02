import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { RATING_API as R } from '../model/rating.const.ts';
import type { PlaceRating } from '../model/rating.types.ts';
import { toPlaceRating } from './ratingMapper.ts';

/** Hợp đồng `/api/places/{placeRef}/rating` của backend; tiêm client để thử không cần mạng. */
export class RatingApi {
  private readonly client: ApiClient;

  /** Dùng máy khách chung (đã gắn Bearer của máy này). */
  constructor(client: ApiClient = apiClient) { this.client = client; }

  /** Đường dẫn rating của một quán; mã quán được mã hóa URL. */
  private path(placeId: string): string {
    return `${R.PLACE}/${encodeURIComponent(placeId)}/${R.RATING}`;
  }

  /** Rating của quán cho người xem. */
  async view(placeId: string, signal?: AbortSignal): Promise<PlaceRating> {
    return toPlaceRating(await this.client.get<unknown>(this.path(placeId), signal));
  }

  /** Chấm hoặc sửa điểm; `comment` rỗng ⇒ không lời bình. */
  async rate(placeId: string, stars: number, comment: string): Promise<PlaceRating> {
    const body = comment.trim() ? { stars, comment } : { stars };
    return toPlaceRating(await this.client.send<unknown>('PUT', this.path(placeId), body));
  }

  /** Xóa điểm của mình. */
  async remove(placeId: string): Promise<PlaceRating> {
    return toPlaceRating(await this.client.send<unknown>('DELETE', this.path(placeId)));
  }

  /** Báo cáo một lời bình. */
  async report(placeId: string, ratingId: string): Promise<void> {
    await this.client.send('POST', `${R.PLACE}/${encodeURIComponent(placeId)}/${R.REPORT}/${encodeURIComponent(ratingId)}/report`);
  }
}
