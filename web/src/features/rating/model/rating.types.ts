/** Điểm tổng hợp của một quán: trung bình một chữ số thập phân (null khi chưa có lượt) và số lượt. */
export interface RatingSummary {
  readonly average: number | null;
  readonly count: number;
}

/** Đánh giá của chính người xem. */
export interface MyRating {
  readonly stars: number;
  readonly comment: string | null;
  readonly updatedAt: string;
}

/** Một lời bình hiển thị (ẩn danh); `mine` cho biết đó là của người xem. */
export interface RatingComment {
  readonly id: string;
  readonly stars: number;
  readonly comment: string;
  readonly updatedAt: string;
  readonly mine: boolean;
}

/** Rating của một quán dưới góc nhìn của người xem. */
export interface PlaceRating {
  readonly summary: RatingSummary;
  readonly mine: MyRating | null;
  readonly comments: readonly RatingComment[];
}
