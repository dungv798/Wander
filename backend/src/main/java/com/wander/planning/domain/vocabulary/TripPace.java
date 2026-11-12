package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Trip pace (Q11, DR-002): a display label, choose one. There is no 'day too packed' warning behavior (that would be an automatic suggestion, plan section 7.2). */
public enum TripPace implements CodedValue {
    RELAXED("relaxed", "Thoải mái"),
    MODERATE("moderate", "Vừa"),
    PACKED("packed", "Dày");

    private final String code;
    private final String label;

    TripPace(String code, String label) {
        this.code = code;
        this.label = label;
    }

    @Override
    public String code() {
        return code;
    }

    /** The Vietnamese label shown to the user. */
    public String label() {
        return label;
    }

    /** The pace by code in data and API; an unknown code returns empty. */
    public static Optional<TripPace> fromCode(String code) {
        return CodedValue.find(TripPace.class, code);
    }
}
