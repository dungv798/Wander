package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
import java.util.Set;
import java.util.UUID;

/**
 * The rule for giving a trip a name that does not clash (DR-006): when another trip of the same owner already uses the name, a suffix ' - 2', ' - 3'... is added
 * with the smallest unused number. The start of the name is cut when needed so the whole name stays within {@value PlanningConstants#MAX_TRIP_NAME}
 * characters. When number suffixes run out a random short code is used.
 */
public final class TripNaming {

    private TripNaming() {
    }

    /** A name that clashes with none of {@code takenNames}, starting from {@code base}. */
    public static String uniqueName(Set<String> takenNames, String base) {
        if (!takenNames.contains(base)) return base;
        for (int n = PlanningConstants.FIRST_NAME_SUFFIX; n < PlanningConstants.MAX_NAME_SUFFIX; n++) {
            String candidate = withSuffix(base, PlanningConstants.NAME_SUFFIX_SEPARATOR + n);
            if (!takenNames.contains(candidate)) return candidate;
        }
        String shortCode = UUID.randomUUID().toString().substring(0, PlanningConstants.NAME_SHORT_CODE_LENGTH);
        return withSuffix(base, PlanningConstants.NAME_SUFFIX_SEPARATOR + shortCode);
    }

    /** Appends the suffix to the end of the name, cutting the start of the name to fit the length limit. */
    private static String withSuffix(String base, String suffix) {
        int keep = Math.min(base.length(), PlanningConstants.MAX_TRIP_NAME - suffix.length());
        return base.substring(0, keep) + suffix;
    }
}
