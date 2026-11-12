package com.wander.catalog.domain.vocabulary;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import java.util.Arrays;

/** The kind of POI fact; rest is a search need, not a kind of place. */
public enum PoiKind {
    FOOD("food"), CAFE("cafe"), FAST_FOOD("fast_food"), BAR("bar"), OTHER("other");

    private final String code;

    PoiKind(String code) {
        this.code = code;
    }

    /** The stable kind code used in JSON. */
    public String code() {
        return code;
    }

    /** Reads the kind of fact; an unknown code is not downgraded to other. */
    public static PoiKind fromCode(String code) {
        PoiValidation.require(Arrays.stream(values()).anyMatch(kind -> kind.code.equals(code)), PoiConstants.KIND);
        return Arrays.stream(values()).filter(kind -> kind.code.equals(code)).findFirst().orElseThrow();
    }

    /** Filters by need: eat only food/fast_food, rest only cafe, all keeps every kind. */
    public boolean matches(String filter) {
        return switch (filter) {
            case PoiConstants.ALL -> true;
            case PoiConstants.FOOD -> this == FOOD || this == FAST_FOOD;
            case PoiConstants.CAFE, PoiConstants.REST -> this == CAFE;
            default -> false;
        };
    }
}
