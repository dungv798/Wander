package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** A time of day. Used for the suggestion 'which part of the day to go'. */
public enum TimeSlot implements CodedValue {
    MORNING("sang"), NOON("trua"), AFTERNOON("chieu"), EVENING("toi");

    private final String code;

    TimeSlot(String code) {
        this.code = code;
    }

    @Override
    public String code() {
        return code;
    }

    /** The time of day by short code in the data; an unknown code returns empty. */
    public static Optional<TimeSlot> fromCode(String code) {
        return CodedValue.find(TimeSlot.class, code);
    }
}
