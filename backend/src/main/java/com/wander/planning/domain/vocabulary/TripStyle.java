package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Trip kind (Q11, DR-002): a display label, choose several. A closed set chosen by the implementation (Tier B, can change).
 * The declaration order is the storage and display order; NO suggestion behavior uses them (plan section 7.2).
 * <p>
 * Adding a new value is safe. Changing a code or dropping a value must come with a data migration for the column {@code trips.styles}: the read path tolerates
 * an unknown code (shown as the raw code) but the write path ({@code TripMapper}) treats an unknown code as a data error.
 */
public enum TripStyle implements CodedValue {
    RELAX("relax", "Nghỉ dưỡng"),
    EXPLORE("explore", "Khám phá"),
    FOOD("food", "Ẩm thực"),
    BEACH("beach", "Biển"),
    MOUNTAIN("mountain", "Núi"),
    CITY("city", "Thành phố"),
    FAMILY("family", "Gia đình"),
    FRIENDS("friends", "Bạn bè");

    private final String code;
    private final String label;

    TripStyle(String code, String label) {
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
    public static Optional<TripStyle> fromCode(String code) {
        return CodedValue.find(TripStyle.class, code);
    }
}
