package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** The kind of place. A short stable code (used in data and the API), a Vietnamese display label. Adding a new value is safe. */
public enum PlaceCategory implements CodedValue {
    CANH("canh", "Cảnh quan"),
    VAN("van", "Văn hóa"),
    AM("am", "Ẩm thực"),
    LEO("leo", "Leo núi"),
    LUU("luu", "Lưu trú"),
    CHO("cho", "Chợ");

    private final String code;
    private final String label;

    PlaceCategory(String code, String label) {
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

    /** The kind by short code in the data; an unknown code returns empty. */
    public static Optional<PlaceCategory> fromCode(String code) {
        return CodedValue.find(PlaceCategory.class, code);
    }
}
