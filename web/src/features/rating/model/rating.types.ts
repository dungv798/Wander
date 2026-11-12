/** The aggregate score of a venue: the average to one decimal place (null when there are no ratings yet) and the number of ratings. */
export interface RatingSummary {
  readonly average: number | null;
  readonly count: number;
}

/** The viewer's own rating. */
export interface MyRating {
  readonly stars: number;
  readonly comment: string | null;
  readonly updatedAt: string;
}

/** A displayed comment (anonymous); `mine` says it is the viewer's. */
export interface RatingComment {
  readonly id: string;
  readonly stars: number;
  readonly comment: string;
  readonly updatedAt: string;
  readonly mine: boolean;
}

/** The rating of a venue from the viewer's point of view. */
export interface PlaceRating {
  readonly summary: RatingSummary;
  readonly mine: MyRating | null;
  readonly comments: readonly RatingComment[];
}
