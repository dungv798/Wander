package com.wander.catalog.domain.rule;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;

/** Checks the new invariants with a domain error, independent of HTTP. */
public final class PoiValidation {
    private PoiValidation() {
    }

    /** Rejects a wrong invariant, keeping the code and field for the adapter or the API to handle. */
    public static void require(boolean valid, String field) {
        if (!valid) throw WanderException.invalid(ErrorCodes.OUT_OF_RANGE, PoiConstants.INVALID_RECORD, field);
    }

    /** Checks the OSM namespace and number, distinguishing node/way/relation with the same number. */
    public static void requireOsmIdentity(String type, long id) {
        require(type != null && type.matches(PoiConstants.OSM_TYPE_PATTERN), PoiConstants.OSM_TYPE);
        require(id > 0, PoiConstants.OSM_ID);
    }

    /** Checks a required string, without changing the raw string. */
    public static void requireText(String value, String field) {
        require(value != null && !value.isBlank(), field);
    }
}
