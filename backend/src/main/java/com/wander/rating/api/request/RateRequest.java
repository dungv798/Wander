package com.wander.rating.api.request;

import com.wander.rating.api.constant.RatingApiConstants;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Body of {@code PUT /api/places/{placeRef}/rating}.
 *
 * @param stars   1 to 5, required: missing is {@code REQUIRED}, a non-integer {@code MALFORMED}, outside the range {@code OUT_OF_RANGE}
 * @param comment optional free text, normalized and length-limited by the rating rules; empty means no comment
 */
public record RateRequest(
        @NotNull @Schema(minimum = RatingApiConstants.STARS_MIN, maximum = RatingApiConstants.STARS_MAX) Integer stars,
        @Schema(maxLength = RatingApiConstants.COMMENT_MAX) String comment) {
}
