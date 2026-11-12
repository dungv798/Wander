/** Constants of Wander rating; they match the backend's `RatingConstants`. */
export const RATING = {
  STAR_VALUES: [1, 2, 3, 4, 5],
  MAX_STARS: 5,
  COMMENT_MAX_LENGTH: 280,
  COMMENT_ROWS: 3,
  FILLED_STAR: '★',
  EMPTY_STAR: '☆',
  AVERAGE_DIGITS: 1,
  LOCALE: 'vi-VN',
  /** The number of comments shown by default; the rest open with 'See all'. */
  PREVIEW_COMMENTS: 2,
} as const;

/** The rating API path of a venue. */
export const RATING_API = {
  PLACE: '/api/places',
  RATING: 'rating',
  REPORT: 'ratings',
} as const;
