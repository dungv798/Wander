package com.wander.rating.application.input;

import com.wander.rating.domain.constant.RatingConstants;
import com.wander.rating.domain.constant.RatingMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import java.util.regex.Pattern;

/** Validates the rating inputs (place reference, stars, comment); the JSON layer has already enforced their types. */
public final class RatingInput {

    private static final Pattern PLACE_REF = Pattern.compile(RatingConstants.PLACE_REF_REGEX);

    private RatingInput() {
    }

    /** A well-formed venue id; otherwise MALFORMED is reported on the {@code placeRef} field. */
    public static String placeRef(String value) {
        if (value == null || !PLACE_REF.matcher(value).matches()) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, RatingFields.PLACE_REF);
        }
        return value;
    }

    /** The score: required, an integer 1-5 (missing => REQUIRED; a string, decimal, boolean => MALFORMED; out of range => OUT_OF_RANGE). */
    public static int stars(Integer number) {
        if (number == null) throw WanderException.invalidValue(ErrorCodes.REQUIRED, RatingFields.STARS);
        if (number < RatingConstants.STARS_MIN || number > RatingConstants.STARS_MAX) {
            throw WanderException.invalid(ErrorCodes.OUT_OF_RANGE, RatingMessages.STARS_OUT_OF_RANGE, RatingFields.STARS);
        }
        return number;
    }

    /** An optional comment: normalized like a user label (no control/invisible characters); empty or not given => null. */
    public static String comment(String raw) {
        if (raw == null) return null;
        String text = Labels.normalize(raw, RatingConstants.COMMENT_MAX_LENGTH, RatingFields.COMMENT);
        return text.isEmpty() ? null : text;
    }
}
