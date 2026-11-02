/** Hằng số của rating Wander; khớp `RatingConstants` của backend. */
export const RATING = {
  STAR_VALUES: [1, 2, 3, 4, 5],
  MAX_STARS: 5,
  COMMENT_MAX_LENGTH: 280,
  COMMENT_ROWS: 3,
  FILLED_STAR: '★',
  EMPTY_STAR: '☆',
  AVERAGE_DIGITS: 1,
  LOCALE: 'vi-VN',
} as const;

/** Đường dẫn API rating của một quán. */
export const RATING_API = {
  PLACE: '/api/places',
  RATING: 'rating',
  REPORT: 'ratings',
} as const;
