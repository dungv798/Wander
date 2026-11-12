package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * The interests of a trip (DR-018 F2, ADR-014): several can be chosen, only labels. Planning must not import catalog so it defines this set itself,
 * matching the place types of the editorial catalog (same codes, labels, order); {@code VocabularyParityTest} guards the two sets against drifting apart.
 */
public enum TripInterest implements CodedValue {
    CANH("canh", "Cảnh quan"),
    VAN("van", "Văn hóa"),
    AM("am", "Ẩm thực"),
    LEO("leo", "Leo núi"),
    LUU("luu", "Lưu trú"),
    CHO("cho", "Chợ");

    private final String code;
    private final String label;

    TripInterest(String code, String label) {
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

    /** The interest by code in data and API; an unknown code returns empty. */
    public static Optional<TripInterest> fromCode(String code) {
        return CodedValue.find(TripInterest.class, code);
    }
}
