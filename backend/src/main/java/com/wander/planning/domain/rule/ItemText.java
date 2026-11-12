package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.util.regex.Pattern;

/** The text rules of an item: the title is required, the note optional (the limits are implementation defaults). */
public final class ItemText {

    private static final Pattern PLACE_ID = Pattern.compile(PlanningConstants.PLACE_ID_REGEX);

    private ItemText() {
    }

    /** The item title: required, trimmed, not longer than the limit. */
    public static String title(String raw) {
        return required(raw, PlanningConstants.MAX_TITLE, PlanningFields.TITLE);
    }

    /**
     * The place id in the catalog: blank => not linked (null); otherwise it must be a slug of at most {@value PlanningConstants#MAX_PLACE_ID_LENGTH}
     * characters. Planning does not look up the catalog (the two modules are independent), so it checks only the shape, not whether the id exists.
     */
    public static String placeId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String stripped = raw.strip();
        if (stripped.length() > PlanningConstants.MAX_PLACE_ID_LENGTH) {
            throw WanderException.invalidValue(ErrorCodes.TOO_LONG, PlanningFields.PLACE_ID);
        }
        if (!PLACE_ID.matcher(stripped).matches()) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.PLACE_ID);
        return stripped;
    }

    /** The note: empty after trimming counts as absent (null). */
    public static String note(String raw) {
        if (raw == null) return null;
        String stripped = raw.strip();
        if (stripped.isEmpty()) return null;
        if (stripped.length() > PlanningConstants.MAX_NOTE) throw WanderException.invalidValue(ErrorCodes.TOO_LONG, PlanningFields.NOTE);
        return stripped;
    }

    /** Required text of the field {@code field}: trimmed, not blank, not longer than {@code max}. */
    public static String required(String raw, int max, String field) {
        String stripped = raw == null ? "" : raw.strip();
        if (stripped.isEmpty()) throw WanderException.invalidValue(ErrorCodes.REQUIRED, field);
        if (stripped.length() > max) throw WanderException.invalidValue(ErrorCodes.TOO_LONG, field);
        return stripped;
    }
}
