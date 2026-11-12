package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * 'Who is going' of a trip (DR-018 F2, ADR-014): choose one, may be empty. Only a label, not yet a member list (Q6-Q9 are 1b).
 * The declaration order is the display order. Changing a code or dropping a value must come with a data migration for the column {@code trips.kind}.
 */
public enum TripKind implements CodedValue {
    SOLO("solo", "Một mình"),
    FAMILY("family", "Gia đình"),
    FRIENDS("friends", "Bạn bè"),
    COUPLE("couple", "Cặp đôi"),
    WORK("work", "Công việc");

    private final String code;
    private final String label;

    TripKind(String code, String label) {
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

    /** The kind by code in data and API; an unknown code returns empty. */
    public static Optional<TripKind> fromCode(String code) {
        return CodedValue.find(TripKind.class, code);
    }
}
