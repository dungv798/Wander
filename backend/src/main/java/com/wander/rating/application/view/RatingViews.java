package com.wander.rating.application.view;

import java.util.List;

/** Results returned to the rating API. The author's identity is never exposed; there is only the {@code mine} flag for the viewer. */
public final class RatingViews {

    private RatingViews() {
    }

    /** The aggregate score of a venue: the average to one decimal place (null when there are no ratings yet) and the number of ratings. */
    public record Summary(Double average, long count) {
    }

    /** The viewer's own score. */
    public record Mine(int stars, String comment, String updatedAt) {
    }

    /** A displayed comment; {@code id} is used to report it. */
    public record CommentView(String id, int stars, String comment, String updatedAt, boolean mine) {
    }

    /** The rating of one venue from the viewer's point of view. */
    public record PlaceRatingView(Summary summary, Mine mine, List<CommentView> comments) {
    }
}
