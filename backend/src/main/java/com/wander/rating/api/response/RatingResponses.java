package com.wander.rating.api.response;

import com.wander.rating.application.view.RatingViews;

/** Response bodies of the rating API. */
public final class RatingResponses {

    private RatingResponses() {
    }

    /** The aggregate rating of a place, the caller's own rating and the latest visible comments. */
    public record RatingResponse(RatingViews.PlaceRatingView rating) {
    }
}
